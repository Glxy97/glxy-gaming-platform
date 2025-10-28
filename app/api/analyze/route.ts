import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/redis-server'
import { sanitizeInput } from '@/lib/auth-security'

function getIP(req: NextRequest) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

interface AnalysisResult {
  ok: boolean
  meta: {
    analyzedAt: string
    source: 'url' | 'html'
    loadTime?: number
  }
  scores: {
    seo: number
    content: number
    performance: number
    accessibility: number
    overall: number
  }
  info: {
    title?: string
    description?: string
    length: number
    images: number
    links: number
    headings: {
      h1: number
      h2: number
      h3: number
    }
    meta: {
      hasDescription: boolean
      hasKeywords: boolean
      hasOpenGraph: boolean
      hasTwitterCard: boolean
    }
    http?: {
      status: number
      ok: boolean
      loadTime?: number
    }
    issues: string[]
    recommendations: string[]
  }
}

function analyzeContent(content: string, url?: string): Omit<AnalysisResult, 'meta'> {
  const issues: string[] = []
  const recommendations: string[] = []

  // Basic content analysis
  const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch?.[1]?.trim() || undefined
  const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  const description = descMatch?.[1] || undefined

  // Meta tag analysis
  const hasMetaDesc = !!description
  const hasKeywords = /<meta[^>]*name=["']keywords["']/i.test(content)
  const hasOpenGraph = /<meta[^>]*property=["']og:/i.test(content)
  const hasTwitterCard = /<meta[^>]*name=["']twitter:/i.test(content)

  // Heading analysis
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length

  // Link and image analysis
  const imgCount = (content.match(/<img\b/gi) || []).length
  const aCount = (content.match(/<a\b/gi) || []).length
  const imgWithoutAlt = (content.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length

  // SEO Issues and Recommendations
  if (!title) {
    issues.push('Kein <title> Tag gefunden')
    recommendations.push('Fügen Sie einen aussagekräftigen Titel hinzu')
  } else if (title.length < 30) {
    issues.push('Titel ist zu kurz (< 30 Zeichen)')
    recommendations.push('Erweitern Sie den Titel auf 30-60 Zeichen')
  } else if (title.length > 60) {
    issues.push('Titel ist zu lang (> 60 Zeichen)')
    recommendations.push('Kürzen Sie den Titel auf maximal 60 Zeichen')
  }

  if (!hasMetaDesc) {
    issues.push('Keine Meta-Beschreibung gefunden')
    recommendations.push('Fügen Sie eine Meta-Beschreibung hinzu (150-160 Zeichen)')
  } else if (description && description.length < 120) {
    recommendations.push('Meta-Beschreibung könnte länger sein (optimal: 150-160 Zeichen)')
  }

  if (h1Count === 0) {
    issues.push('Keine H1-Überschrift gefunden')
    recommendations.push('Fügen Sie eine H1-Überschrift hinzu')
  } else if (h1Count > 1) {
    issues.push(`Mehrere H1-Überschriften gefunden (${h1Count})`)
    recommendations.push('Verwenden Sie nur eine H1-Überschrift pro Seite')
  }

  if (!hasOpenGraph) {
    recommendations.push('Fügen Sie Open Graph Tags für bessere Social Media Integration hinzu')
  }

  if (!hasTwitterCard) {
    recommendations.push('Fügen Sie Twitter Card Tags hinzu')
  }

  if (imgWithoutAlt > 0) {
    issues.push(`${imgWithoutAlt} Bilder ohne alt-Attribut gefunden`)
    recommendations.push('Fügen Sie alt-Attribute zu allen Bildern hinzu')
  }

  // Score calculation (more sophisticated)
  let seoScore = 0
  if (title && title.length >= 30 && title.length <= 60) seoScore += 2
  else if (title) seoScore += 1

  if (hasMetaDesc && description && description.length >= 120 && description.length <= 160) seoScore += 2
  else if (hasMetaDesc) seoScore += 1

  if (h1Count === 1) seoScore += 2
  else if (h1Count > 0) seoScore += 1

  if (hasOpenGraph) seoScore += 1
  if (hasTwitterCard) seoScore += 1
  if (imgWithoutAlt === 0 && imgCount > 0) seoScore += 1

  const contentScore = Math.min(10, Math.floor(content.length / 1000))
  const performanceScore = content.length < 100000 ? 8 : content.length < 500000 ? 6 : 4
  const accessibilityScore = imgWithoutAlt === 0 ? 8 : Math.max(4, 8 - imgWithoutAlt)

  const overallScore = Math.min(10, Math.floor((seoScore + contentScore + performanceScore + accessibilityScore) / 4))

  return {
    ok: true,
    scores: {
      seo: seoScore,
      content: contentScore,
      performance: performanceScore,
      accessibility: accessibilityScore,
      overall: overallScore
    },
    info: {
      title,
      description,
      length: content.length,
      images: imgCount,
      links: aCount,
      headings: {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count
      },
      meta: {
        hasDescription: hasMetaDesc,
        hasKeywords,
        hasOpenGraph,
        hasTwitterCard
      },
      issues,
      recommendations
    }
  }
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const rl = await RateLimiter.checkRateLimit('website-analyze', 15, 60_000, ip)
  if (!rl.allowed) {
    return NextResponse.json({
      error: 'Zu viele Anfragen. Bitte versuche es in einer Minute erneut.',
      retryAfter: Math.ceil((rl.resetTime - Date.now()) / 1000)
    }, { status: 429 })
  }

  let body: { url?: string; html?: string; timestamp?: number } | null = null
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'Ungültiges JSON-Format' }, { status: 400 })
  }

  const rawUrl = (body?.url || '').toString().trim()
  const rawHtml = (body?.html || '').toString()
  const url = sanitizeInput(rawUrl)
  const html = rawHtml.slice(0, 1_000_000) // 1MB limit
  const startTime = body?.timestamp || Date.now()

  if (!url && !html) {
    return NextResponse.json({ error: 'Bitte gib eine URL oder HTML-Code an' }, { status: 400 })
  }

  // Validate URL format
  if (url && !url.match(/^https?:\/\/.+/)) {
    return NextResponse.json({ error: 'Ungültiges URL-Format. Bitte verwende http:// oder https://' }, { status: 400 })
  }

  const analyzedAt = new Date().toISOString()
  let loadTimeMs = 0

  try {
    let content = html
    let httpInfo: { status: number; ok: boolean; loadTime?: number } | undefined

    // Fetch content if URL provided
    if (!content && url) {
      const fetchStart = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'GLXY-Website-Analyzer/1.0 (Gaming Platform)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
          },
          redirect: 'follow'
        })

        const fetchEnd = Date.now()
        loadTimeMs = fetchEnd - fetchStart

        if (res.ok) {
          content = await res.text()
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        httpInfo = {
          status: res.status,
          ok: res.ok,
          loadTime: loadTimeMs
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Website-Anfrage Timeout (>10s)')
        }
        throw new Error(`Fehler beim Laden der Website: ${fetchError.message}`)
      } finally {
        clearTimeout(timeout)
      }
    }

    if (!content) {
      return NextResponse.json({
        error: 'Kein Inhalt zum Analysieren verfügbar'
      }, { status: 400 })
    }

    // Limit content size for analysis
    content = content.slice(0, 1_000_000) // 1MB limit

    // Perform comprehensive analysis
    const analysis = analyzeContent(content, url)

    const result: AnalysisResult = {
      ...analysis,
      meta: {
        analyzedAt,
        source: url ? 'url' : 'html',
        loadTime: loadTimeMs || undefined
      }
    }

    // Add HTTP info if available
    if (httpInfo) {
      result.info.http = httpInfo
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'Content-Type': 'application/json'
      }
    })
  } catch (e: any) {
    console.error('Website analysis error:', e)
    return NextResponse.json({
      error: e?.message || 'Website-Analyse fehlgeschlagen',
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}

