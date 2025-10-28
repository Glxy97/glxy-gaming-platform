'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Search, CheckCircle, XCircle, AlertTriangle, FileText, Image, Link, Clock, Gauge, BarChart3 } from 'lucide-react'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { GamingButton } from '@/components/ui/gaming-button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

interface AnalysisResult {
  ok: boolean
  meta: {
    analyzedAt: string
    source: 'url' | 'html'
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

export default function GLXYAnalyzer() {
  const [url, setUrl] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const analyze = async () => {
    if (!url.trim() && !html.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib eine URL ein oder füge HTML-Code hinzu.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const startTime = Date.now()
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          html: html.trim() || undefined,
          timestamp: startTime
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Analyse fehlgeschlagen')

      setResult(data)
      toast({
        title: 'Analyse abgeschlossen',
        description: `Website erfolgreich analysiert (Score: ${data.scores?.overall || 0}/10)`
      })
    } catch (e: any) {
      setError(e.message || 'Analyse fehlgeschlagen')
      toast({
        title: 'Analyse fehlgeschlagen',
        description: e.message || 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500'
    if (score >= 5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 8) return CheckCircle
    if (score >= 5) return AlertTriangle
    return XCircle
  }

  return (
    <div className="space-y-8">
      {/* Eingabe Sektion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GamingCard variant="glass">
          <GamingCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gaming-primary/20 flex items-center justify-center text-gaming-primary">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Website Analyzer</h2>
            </div>
          </GamingCardHeader>
          <GamingCardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>

              <div className="text-center text-muted-foreground">oder</div>

              <div>
                <label className="block text-sm font-medium mb-2">HTML Code direkt einfügen</label>
                <textarea
                  className="w-full h-32 p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gaming-primary font-mono text-sm"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<!DOCTYPE html>\n<html>\n  <head>\n    <title>...</title>\n  </head>\n  ..."
                />
              </div>
            </div>

            <GamingButton
              onClick={analyze}
              disabled={loading || (!url.trim() && !html.trim())}
              size="lg"
              glow
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Website analysieren
                </>
              )}
            </GamingButton>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Analyse fehlgeschlagen</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}
          </GamingCardContent>
        </GamingCard>
      </motion.div>

      {/* Ergebnisse */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Overall Score */}
          <GamingCard variant="glass">
            <GamingCardContent className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gaming-primary/20 mb-4">
                <span className="text-3xl font-bold text-gaming-primary">{result.scores.overall}</span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Gesamt-Score</h3>
              <p className="text-muted-foreground">
                {result.info.title || 'Unbenannte Website'}
              </p>
              {result.meta.analyzedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Analysiert am {new Date(result.meta.analyzedAt).toLocaleString('de-DE')}
                </p>
              )}
            </GamingCardContent>
          </GamingCard>

          {/* Detailierte Scores */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { key: 'seo', label: 'SEO', icon: Search, description: 'Suchmaschinenoptimierung' },
              { key: 'content', label: 'Inhalt', icon: FileText, description: 'Inhaltsqualität' },
              { key: 'performance', label: 'Performance', icon: Gauge, description: 'Ladegeschwindigkeit' },
              { key: 'accessibility', label: 'Barrierefreiheit', icon: BarChart3, description: 'Zugänglichkeit' }
            ].map(({ key, label, icon: Icon, description }) => {
              const score = result.scores[key as keyof typeof result.scores] || 0
              const ScoreIcon = getScoreIcon(score)
              return (
                <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                  <GamingCard variant="default">
                    <GamingCardContent className="text-center p-6">
                      <div className="flex items-center justify-center mb-3">
                        <Icon className="w-8 h-8 text-gaming-primary" />
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${getScoreColor(score)}`}>
                        {score}/10
                      </div>
                      <h4 className="font-semibold mb-1">{label}</h4>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </GamingCardContent>
                  </GamingCard>
                </motion.div>
              )
            })}
          </div>

          {/* Detaillierte Informationen */}
          <div className="grid gap-6 md:grid-cols-2">
            <GamingCard variant="default">
              <GamingCardHeader>
                <h3 className="text-lg font-semibold">📊 Website-Statistiken</h3>
              </GamingCardHeader>
              <GamingCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Inhaltslänge</div>
                    <div className="font-semibold">{result.info.length.toLocaleString()} Zeichen</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bilder</div>
                    <div className="font-semibold">{result.info.images}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Links</div>
                    <div className="font-semibold">{result.info.links}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">H1 Überschriften</div>
                    <div className="font-semibold">{result.info.headings?.h1 || 0}</div>
                  </div>
                </div>

                {result.info.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Meta-Beschreibung</div>
                    <div className="text-sm bg-muted p-2 rounded">{result.info.description}</div>
                  </div>
                )}
              </GamingCardContent>
            </GamingCard>

            <GamingCard variant="default">
              <GamingCardHeader>
                <h3 className="text-lg font-semibold">🔍 SEO-Features</h3>
              </GamingCardHeader>
              <GamingCardContent className="space-y-3">
                {[
                  { key: 'hasDescription', label: 'Meta-Beschreibung' },
                  { key: 'hasKeywords', label: 'Meta-Keywords' },
                  { key: 'hasOpenGraph', label: 'Open Graph Tags' },
                  { key: 'hasTwitterCard', label: 'Twitter Card' }
                ].map(({ key, label }) => {
                  const hasFeature = result.info.meta?.[key as keyof typeof result.info.meta]
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <div className="flex items-center gap-1">
                        {hasFeature ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${hasFeature ? 'text-green-600' : 'text-red-600'}`}>
                          {hasFeature ? 'Vorhanden' : 'Fehlt'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </GamingCardContent>
            </GamingCard>
          </div>

          {/* Empfehlungen */}
          {result.info.recommendations?.length > 0 && (
            <GamingCard variant="default">
              <GamingCardHeader>
                <h3 className="text-lg font-semibold">💡 Empfehlungen</h3>
              </GamingCardHeader>
              <GamingCardContent>
                <ul className="space-y-2">
                  {result.info.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gaming-primary mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </GamingCardContent>
            </GamingCard>
          )}

          {/* Probleme */}
          {result.info.issues?.length > 0 && (
            <GamingCard variant="default">
              <GamingCardHeader>
                <h3 className="text-lg font-semibold text-red-600">⚠️ Gefundene Probleme</h3>
              </GamingCardHeader>
              <GamingCardContent>
                <ul className="space-y-2">
                  {result.info.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </GamingCardContent>
            </GamingCard>
          )}
        </motion.div>
      )}
    </div>
  )
}

