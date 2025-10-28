#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { ExpertConfig, ExpertReport, RoadmapItem } from '../agent-configs/types/expert-master-developer.types'

function loadConfig(): ExpertConfig {
  const p = path.join(__dirname, '../agent-configs/expert-master-developer.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function exists(p: string) { try { return fs.existsSync(p) } catch { return false } }
function read(p: string) { return exists(p) ? fs.readFileSync(p, 'utf8') : '' }

function bool(b: boolean) { return b ? 'Yes' : 'No' }

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  const cfg = loadConfig()
  const root = path.join(__dirname, '..')

  // Quick signals gathering
  const hasSocketRedis = /createAdapter\(/.test(read(path.join(root, 'server.ts')))
  const hasSocketAuth = /authenticateSocket/.test(read(path.join(root, 'lib/auth.ts')))
  const hasSecurityHeaders = /Content-Security-Policy/.test(read(path.join(root, 'middleware.ts')))
  const hasHealth = exists(path.join(root, 'app/api/health/route.ts'))
  const hasApiMonitoring = exists(path.join(root, 'lib/api-monitoring.ts'))
  const hasSocketManager = exists(path.join(root, 'lib/socket-manager.ts'))

  const roadmap: RoadmapItem[] = []

  if (!hasSocketRedis) {
    roadmap.push({ title: 'Adopt Redis adapter for Socket.IO', impact: 'high', effort: 'S', rationale: 'Enables horizontal scaling and cross-node room events', owners: ['backend'] })
  }
  if (!hasSocketAuth) {
    roadmap.push({ title: 'Enforce strict Socket.IO authentication', impact: 'high', effort: 'S', rationale: 'Prevents anonymous abuse and ties actions to users', owners: ['security','backend'] })
  }
  if (!hasSecurityHeaders) {
    roadmap.push({ title: 'Harden security headers (CSP, FPD)', impact: 'high', effort: 'S', rationale: 'Reduces XSS and clickjacking surface', owners: ['security','platform'] })
  }
  if (!hasHealth || !hasApiMonitoring) {
    roadmap.push({ title: 'Production health and API metrics', impact: 'medium', effort: 'S', rationale: 'Improves observability and incident response', owners: ['platform'] })
  }
  if (hasSocketManager) {
    roadmap.push({ title: 'Add E2E multiplayer smoke tests', impact: 'high', effort: 'M', rationale: 'Guard rail for regressions in real-time features', owners: ['qa','backend','frontend'] })
  }

  const conventions: string[] = [
    'Adopt feature-based folders: app/(feature)/[routes], components/(feature), lib/(domain)',
    'Define Socket.IO event contracts in a single types module and re-use on client and server',
    'Wrap Redis with a CacheManager exposing typed get/set/incr with TTLs',
    'Centralize rate limiting (API + Socket) with shared helpers',
    'Prefer server actions for simple mutations; reserve API routes for complex flows',
    'Co-locate tests next to implementation: *.test.ts(x) under same folder'
  ]

  const report: ExpertReport = {
    timestamp: new Date().toISOString(),
    agent_version: cfg.version,
    summary: [
      `Socket Redis adapter: ${bool(hasSocketRedis)}`,
      `Socket auth middleware: ${bool(hasSocketAuth)}`,
      `Security headers (CSP): ${bool(hasSecurityHeaders)}`,
      `Health endpoint: ${bool(hasHealth)}`,
      `API monitoring lib: ${bool(hasApiMonitoring)}`
    ],
    roadmap,
    conventions
  }

  const outDir = path.join(root, 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `expert-review-${Date.now()}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  if (!quiet) {
    console.log('Expert review generated: ' + outPath)
  } else {
    console.log(outPath)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
