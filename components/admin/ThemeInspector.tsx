'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'

type VarItem = { name: string; sampleClass?: string; isColor?: boolean }

const VARS: VarItem[] = [
  { name: '--background', isColor: true },
  { name: '--foreground', isColor: true },
  { name: '--card', isColor: true },
  { name: '--card-foreground', isColor: true },
  { name: '--primary', isColor: true },
  { name: '--primary-foreground', isColor: true },
  { name: '--secondary', isColor: true },
  { name: '--secondary-foreground', isColor: true },
  { name: '--accent', isColor: true },
  { name: '--accent-foreground', isColor: true },
  { name: '--muted', isColor: true },
  { name: '--muted-foreground', isColor: true },
  { name: '--border', isColor: true },
  { name: '--ring', isColor: true },
]

export function ThemeInspector() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [brandEnabled, setBrandEnabled] = useState<boolean>(true)
  const [values, setValues] = useState<Record<string, string>>({})

  const readVars = useCallback(() => {
    const el = document.body
    const c = getComputedStyle(el)
    const v: Record<string, string> = {}
    for (const item of VARS) {
      v[item.name] = c.getPropertyValue(item.name).trim()
    }
    setValues(v)
  }, [])

  useEffect(() => {
    // initial brand detection
    setBrandEnabled(document.body.classList.contains('theme-glxy'))
    readVars()
  }, [readVars])

  const toggleBrand = useCallback(() => {
    const has = document.body.classList.toggle('theme-glxy')
    setBrandEnabled(has)
    readVars()
  }, [readVars])

  const setMode = useCallback((mode: 'light'|'dark') => {
    setTheme(mode)
    // wait for class swap, then read
    setTimeout(readVars, 50)
  }, [setTheme, readVars])

  const items = useMemo(() => VARS.map(item => ({ ...item, value: values[item.name] || '' })), [values])

  // Presets
  const [presets, setPresets] = useState<string[]>([])
  const [presetName, setPresetName] = useState('')

  const refreshPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/theme/presets')
      const data = await res.json()
      setPresets(data?.presets || [])
    } catch {}
  }, [])

  useEffect(() => { refreshPresets() }, [refreshPresets])

  const snapshotTokens = useCallback(() => {
    const out: Record<string, string> = {}
    for (const it of VARS) out[it.name] = values[it.name] || ''
    return out
  }, [values])

  const downloadSnapshot = useCallback(() => {
    const tokens = snapshotTokens()
    const blob = new Blob([JSON.stringify({ tokens }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `glxy-theme-snapshot-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [snapshotTokens])

  const savePreset = useCallback(async () => {
    const name = presetName.trim()
    if (!name) return
    const res = await fetch('/api/theme/presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, tokens: snapshotTokens() }) })
    if (res.ok) {
      setPresetName('')
      refreshPresets()
    } else {
      alert('Speichern fehlgeschlagen (Admin erforderlich)')
    }
  }, [presetName, snapshotTokens, refreshPresets])

  const applyGlobal = useCallback(async () => {
    const res = await fetch('/api/theme/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokens: snapshotTokens() }) })
    if (!res.ok) alert('Globales Anwenden fehlgeschlagen (Admin erforderlich)')
  }, [snapshotTokens])

  const applyPreset = useCallback(async (name: string) => {
    const res = await fetch(`/api/theme/presets/${encodeURIComponent(name)}`)
    const data = await res.json()
    if (data?.tokens) {
      Object.entries<string>(data.tokens).forEach(([k, v]) => document.body.style.setProperty(k, v))
      readVars()
    }
  }, [readVars])

  const deletePreset = useCallback(async (name: string) => {
    if (!name) return
    const ok = confirm(`Preset "${name}" wirklich löschen?`)
    if (!ok) return
    const res = await fetch(`/api/theme/presets/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (res.ok) refreshPresets()
  }, [refreshPresets])

  const downloadCssPatch = useCallback(() => {
    // Create a CSS block for app/brand/glxy.css with current tokens
    const tokens = snapshotTokens()
    const lines: string[] = []
    lines.push('@layer base {')
    lines.push('  .theme-glxy {')
    for (const [k, v] of Object.entries(tokens)) {
      lines.push(`    ${k}: ${v};`)
    }
    lines.push('  }')
    lines.push('}')
    const blob = new Blob([lines.join('\n')], { type: 'text/css' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'glxy-theme-overrides.css'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [snapshotTokens])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Brand:</span>
        <button onClick={toggleBrand} className="border border-border rounded px-3 py-1 bg-card">
          {brandEnabled ? 'GLXY aktiviert' : 'GLXY deaktiviert'}
        </button>
        <span className="ml-4 text-sm text-muted-foreground">Modus:</span>
        <button onClick={() => setMode('dark')} className={`border border-border rounded px-3 py-1 ${resolvedTheme==='dark' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>Dark</button>
        <button onClick={() => setMode('light')} className={`border border-border rounded px-3 py-1 ${resolvedTheme==='light' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>Light</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.name} className="border border-border rounded-lg p-3 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{it.name}</div>
              <button
                className="text-xs border border-border rounded px-2 py-0.5"
                onClick={() => navigator.clipboard.writeText(it.value || '')}
              >Copy</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-border" style={{ background: `hsl(${it.value})` }} />
              <div className="text-xs text-muted-foreground truncate">{it.value || '(leer)'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-2">Buttons</div>
          <div className="flex flex-wrap gap-2">
            <button className="bg-primary text-primary-foreground px-3 py-1 rounded">Primary</button>
            <button className="bg-secondary text-secondary-foreground px-3 py-1 rounded">Secondary</button>
            <button className="border border-border px-3 py-1 rounded">Default</button>
          </div>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-2">Karten</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 bg-background">
              <div className="text-sm">Background</div>
              <div className="text-xs text-muted-foreground">Text & Ränder</div>
            </div>
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="text-sm">Card</div>
              <div className="text-xs text-muted-foreground">Card‑Surface</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-sm text-muted-foreground mb-2">Presets</div>
        <div className="flex flex-wrap items-center gap-2">
          <input className="border border-border bg-background text-foreground rounded px-2 py-1" placeholder="Preset‑Name" value={presetName} onChange={e => setPresetName(e.target.value)} />
          <button className="bg-primary text-primary-foreground px-3 py-1 rounded" onClick={savePreset}>Preset speichern</button>
          <button className="border border-border px-3 py-1 rounded" onClick={downloadSnapshot}>Snapshot herunterladen</button>
          <select className="border border-border bg-background text-foreground rounded px-2 py-1" onChange={e => e.target.value && applyPreset(e.target.value)}>
            <option value="">Preset laden…</option>
            {presets.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="border border-border bg-background text-foreground rounded px-2 py-1" onChange={e => e.target.value && deletePreset(e.target.value)}>
            <option value="">Preset löschen…</option>
            {presets.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="border border-border px-3 py-1 rounded" onClick={downloadCssPatch}>Als CSS speichern</button>
          <button className="bg-secondary text-secondary-foreground px-3 py-1 rounded" onClick={applyGlobal}>Global anwenden (aktuell)</button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Hinweis: Server‑Speichern erfordert Admin‑Rechte (ENV: ADMIN_EMAILS/ADMIN_USER_IDS).</div>
      </div>
    </div>
  )
}
