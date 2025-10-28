#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { FrontendAgentConfig, AnalysisReport, Finding } from '../agent-configs/types/frontend-ux-performance.types'

function loadConfig(): FrontendAgentConfig {
  const p = path.join(__dirname, '../agent-configs/frontend-ux-performance.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function exists(p: string) { try { return fs.existsSync(p) } catch { return false } }
function read(p: string) { return exists(p) ? fs.readFileSync(p, 'utf8') : '' }

function walk(dir: string, pred: (p: string) => boolean, acc: string[] = []): string[] {
  if (!exists(dir)) return acc
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e)
    const st = fs.statSync(f)
    if (st.isDirectory()) walk(f, pred, acc)
    else if (pred(f)) acc.push(f)
  }
  return acc
}

function push(findings: Finding[], category: string, name: string, cond: boolean, okMsg: string, warnMsg: string, file_path?: string) {
  findings.push({ category, name, status: cond ? 'PASS' : 'WARNING', message: cond ? okMsg : warnMsg, file_path })
}

function score(findings: Finding[]): number {
  let s = 100
  for (const f of findings) if (f.status !== 'PASS') s -= 2
  return Math.max(0, s)
}

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  const cfg = loadConfig()
  const root = path.join(__dirname, '..')
  const findings: Finding[] = []

  // Socket lifecycle checks
  const smPath = path.join(root, 'lib/socket-manager.ts')
  const spPath = path.join(root, 'components/providers/socket-provider.tsx')
  const socketMgr = read(smPath)
  const socketProv = read(spPath)

  push(findings, 'Socket', 'connect_error handled', /connect_error/.test(socketMgr) || /connect_error/.test(socketProv), 'connect_error handled', 'Handle connect_error event', smPath)
  push(findings, 'Socket', 'reconnect handled', /reconnect/.test(socketMgr) || /reconnect/.test(socketProv), 'reconnect handled', 'Handle reconnect events', smPath)
  push(findings, 'Socket', 'cleanup on unmount', /disconnect\(\)/.test(socketMgr) || /off\(/.test(socketProv), 'cleanup present', 'Ensure listeners are cleaned on unmount', spPath)

  // UI performance patterns across components
  const componentsDir = path.join(root, 'components')
  const uiFiles = walk(componentsDir, p => p.endsWith('.tsx'))
  let memoCount = 0, cbCount = 0
  for (const f of uiFiles) {
    const c = read(f)
    if (/useMemo\(/.test(c)) memoCount++
    if (/useCallback\(/.test(c)) cbCount++
  }
  push(findings, 'Performance', 'useMemo sprinkled', memoCount > 0, `useMemo used in ${memoCount} files`, 'Consider using useMemo for expensive derives', componentsDir)
  push(findings, 'Performance', 'useCallback sprinkled', cbCount > 0, `useCallback used in ${cbCount} files`, 'Consider useCallback for stable handlers', componentsDir)

  // UX signals
  const hasSkeleton = exists(path.join(root, 'components/ui/skeleton.tsx'))
  push(findings, 'UX', 'Skeletons present', hasSkeleton, 'Skeleton component present', 'Add skeleton loaders for perceived performance', 'components/ui/skeleton.tsx')

  // Games integration health (chess)
  const chessBoard = path.join(root, 'components/games/chess/chess-board.tsx')
  const chess = read(chessBoard)
  push(findings, 'Games', 'Chess emits game:move', /game:move/.test(chess), 'Chess emits game:move', 'Missing socket emit for moves', chessBoard)
  push(findings, 'Games', 'Chess chat off cleanup', /socket\.off\(/.test(read(path.join(root, 'components/games/chess/chess-chat.tsx'))), 'Chat listeners cleaned', 'Ensure socket.off cleanup in chat', 'components/games/chess/chess-chat.tsx')

  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    agent_version: cfg.version,
    score: score(findings),
    findings,
    recommendations: []
  }

  const outDir = path.join(root, 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `frontend-analysis-${Date.now()}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  if (!quiet) {
    console.log(`Frontend analysis score: ${report.score}`)
    console.log(`Report: ${outPath}`)
  } else {
    console.log(`${report.score} ${outPath}`)
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
