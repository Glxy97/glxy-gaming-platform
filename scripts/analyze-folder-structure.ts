#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { FolderStructureConfig, StructureReport, Finding } from '../agent-configs/types/folder-structure-agent.types'

function loadConfig(): FolderStructureConfig {
  const p = path.join(__dirname, '../agent-configs/folder-structure-agent.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function exists(p: string) { try { return fs.existsSync(p) } catch { return false } }
function readDir(p: string) { try { return fs.readdirSync(p) } catch { return [] as string[] } }

function walk(dir: string, ignore: string[], out: string[] = []): string[] {
  if (!exists(dir)) return out
  const names = fs.readdirSync(dir)
  for (const name of names) {
    const full = path.join(dir, name)
    if (ignore.some(i => full.includes(`/${i}/`) || full.endsWith(`/${i}`))) continue
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, ignore, out)
    else out.push(full)
  }
  return out
}

function push(findings: Finding[], category: string, name: string, cond: boolean, okMsg: string, notOkMsg: string, file_path?: string, status: 'PASS'|'WARNING'|'FAIL' = 'WARNING') {
  findings.push({ category, name, status: cond ? 'PASS' : status, message: cond ? okMsg : notOkMsg, file_path })
}

function computeScore(findings: Finding[]): number {
  let s = 100
  for (const f of findings) {
    if (f.status === 'WARNING') s -= 2
    if (f.status === 'FAIL') s -= 6
  }
  return Math.max(0, s)
}

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  const cfg = loadConfig()
  const root = path.join(__dirname, '..')

  const findings: Finding[] = []
  const ignore = cfg.file_patterns.ignore || []

  // 1) Baseline required roots
  const required = cfg.file_patterns.roots || []
  for (const r of required) {
    const p = path.join(root, r)
    push(findings, 'Structure', `Dir: ${r}`, exists(p), `${r} present`, `${r} missing`, p, r === 'app' || r === 'pages' ? 'WARNING' : 'FAIL')
  }

  // 2) Check app/pages consolidation
  const hasApp = exists(path.join(root, 'app'))
  const hasPages = exists(path.join(root, 'pages'))
  if (hasApp && hasPages) {
    findings.push({
      category: 'Next.js',
      name: 'App & Pages both present',
      status: 'WARNING',
      message: 'Beide Router vorhanden – Konsolidierung planen (App Router bevorzugt)'
    })
  } else {
    findings.push({ category: 'Next.js', name: 'Router usage', status: 'PASS', message: hasApp ? 'App Router' : 'Pages Router' })
  }

  // 3) Hygiene: backup/disabled/temp files
  const files = walk(root, ignore)
  const badPatterns = [/\.bak(\.|$)/i, /\.backup(\.|$)/i, /\.disabled$/i, /~$/]
  const spaced = files.filter(f => /\s/.test(path.basename(f)))
  const badFiles = files.filter(f => badPatterns.some(rx => rx.test(f)))
  push(findings, 'Hygiene', 'No backup/disabled files', badFiles.length === 0, 'Keine Backup/Disabled Dateien', `Gefunden: ${badFiles.slice(0,5).map(f=>path.relative(root,f)).join(', ')}${badFiles.length>5?' …':''}`, undefined, 'WARNING')
  push(findings, 'Hygiene', 'No spaces in filenames', spaced.length === 0, 'Keine Leerzeichen in Dateinamen', `Gefunden: ${spaced.slice(0,5).map(f=>path.relative(root,f)).join(', ')}${spaced.length>5?' …':''}`, undefined, 'WARNING')

  // 4) Deep nesting check (more than 7 segments under components)
  const compRoot = path.join(root, 'components')
  if (exists(compRoot)) {
    const deep = walk(compRoot, ignore).filter(f => path.relative(compRoot, f).split(path.sep).length > 7)
    push(findings, 'Structure', 'Avoid very deep component nesting', deep.length === 0, 'Tiefe Struktur OK', `Sehr tiefe Pfade: ${deep.slice(0,5).map(f=>path.relative(root,f)).join(', ')}${deep.length>5?' …':''}`)
  }

  // 5) Tests presence
  const testsDir = path.join(root, '__tests__')
  push(findings, 'Tests', '__tests__ present', exists(testsDir), '__tests__ vorhanden', '__tests__ fehlt (oder Co-location verwenden)', testsDir, 'WARNING')

  // 6) README presence in agent-configs and scripts
  const agentsReadme = path.join(root, 'agent-configs/README.md')
  push(findings, 'Docs', 'agent-configs README', exists(agentsReadme), 'Dokumentation vorhanden', 'README in agent-configs fehlt', agentsReadme, 'WARNING')

  // 7) Oversized source files (> 350KB) in src areas
  const sources = files.filter(f => /(components|lib|app|pages)\//.test(f))
  const big: string[] = []
  for (const f of sources) {
    try {
      const st = fs.statSync(f)
      if (st.size > 350 * 1024) big.push(f)
    } catch {}
  }
  push(findings, 'Performance', 'No very large source files', big.length === 0, 'Keine übergroßen Quell-Dateien', `Große Dateien: ${big.slice(0,3).map(f=>path.relative(root,f)).join(', ')}${big.length>3?' …':''}`)

  // Report
  const report: StructureReport = {
    timestamp: new Date().toISOString(),
    agent_version: cfg.version,
    score: computeScore(findings),
    findings,
    recommendations: []
  }

  if (hasApp && hasPages) report.recommendations.push('Langfristig App Router priorisieren und Pages migrieren')
  if (badFiles.length) report.recommendations.push('Backup/Disabled Dateien entfernen oder umbenennen')
  if (spaced.length) report.recommendations.push('Leerzeichen in Dateinamen vermeiden (kebab-case empfehlen)')

  const outDir = path.join(root, 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `folder-structure-analysis-${Date.now()}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  if (!quiet) {
    console.log(`Folder structure score: ${report.score}`)
    console.log(`Report: ${outPath}`)
  } else {
    console.log(`${report.score} ${outPath}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })

