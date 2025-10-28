#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { BackendOptimizerConfig, AnalysisReport, Finding } from '../agent-configs/types/backend-optimizer.types'

function loadConfig(): BackendOptimizerConfig {
  const p = path.join(__dirname, '../agent-configs/backend-optimizer.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function exists(p: string) { try { return fs.existsSync(p) } catch { return false } }
function read(p: string) { return exists(p) ? fs.readFileSync(p, 'utf8') : '' }

function push(findings: Finding[], category: string, name: string, cond: boolean, okMsg: string, badMsg: string, file_path?: string) {
  findings.push({ category, name, status: cond ? 'PASS' : 'WARNING', message: cond ? okMsg : badMsg, file_path })
}

function score(findings: Finding[]): number {
  let s = 100
  for (const f of findings) {
    if (f.status === 'WARNING') s -= 2
    if (f.status === 'FAIL') s -= 8
  }
  return Math.max(0, s)
}

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  const cfg = loadConfig()
  const root = path.join(__dirname, '..')

  const findings: Finding[] = []

  // server.ts checks
  const serverPath = path.join(root, 'server.ts')
  const server = read(serverPath)
  const hasRedisAdapter = /createAdapter\(/.test(server)
  const hasAuthMiddleware = /io\.use\(/.test(server) && /authenticateSocket/.test(server)
  const hasGracefulShutdown = /SIGTERM/.test(server)
  const hasRateLimits = /rateLimit\(/.test(server)
  push(findings, 'Realtime', 'Redis adapter', hasRedisAdapter, 'Redis adapter configured', 'Consider enabling Redis adapter for scale', serverPath)
  push(findings, 'Realtime', 'Auth middleware', hasAuthMiddleware, 'Socket auth middleware present', 'Add authentication middleware', serverPath)
  push(findings, 'Platform', 'Graceful shutdown', hasGracefulShutdown, 'Graceful shutdown present', 'Add SIGTERM graceful shutdown', serverPath)
  push(findings, 'Protection', 'Rate limiting', hasRateLimits, 'Rate limits present', 'Add rate limits for connects/actions/chat', serverPath)

  // lib/redis.ts presence
  const redisLib = path.join(root, 'lib/redis.ts')
  push(findings, 'Caching', 'Redis client', exists(redisLib), 'Redis client present', 'Add Redis client wrapper', redisLib)

  // Monitoring and health
  const monitoringLib = path.join(root, 'lib/monitoring.ts')
  const apiMonitoringLib = path.join(root, 'lib/api-monitoring.ts')
  push(findings, 'Observability', 'Monitoring lib', exists(monitoringLib), 'Monitoring utils present', 'Consider adding monitoring utilities', monitoringLib)
  push(findings, 'Observability', 'API monitoring', exists(apiMonitoringLib), 'API monitoring present', 'Add API monitoring hooks', apiMonitoringLib)
  push(findings, 'Observability', 'Health endpoint', exists(path.join(root, 'app/api/health/route.ts')), 'Health endpoint present', 'Add /api/health route', 'app/api/health/route.ts')

  // Prisma presence and migrations
  const prismaDir = path.join(root, 'prisma')
  push(findings, 'Data', 'Prisma present', exists(prismaDir), 'Prisma folder present', 'Prisma schema missing', prismaDir)
  const perfSql = path.join(root, 'add-performance-indexes.sql')
  push(findings, 'Data', 'Indexes SQL', exists(perfSql), 'Index script present', 'Consider adding DB indexes script', perfSql)

  // Security headers in middleware
  const mwPath = path.join(root, 'middleware.ts')
  const mw = read(mwPath)
  push(findings, 'Security', 'CSP header', /Content-Security-Policy/.test(mw), 'CSP configured', 'Add CSP header', mwPath)

  // Compose report
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    agent_version: cfg.version,
    score: score(findings),
    findings,
    recommendations: []
  }

  if (!hasRedisAdapter) report.recommendations.push('Enable @socket.io/redis-adapter for horizontal scaling')
  if (!hasAuthMiddleware) report.recommendations.push('Harden Socket.IO by enforcing auth in middleware')
  if (!hasRateLimits) report.recommendations.push('Enforce rate limiting for connects, actions and chat')

  const outDir = path.join(root, 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `backend-analysis-${Date.now()}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  if (!quiet) {
    console.log(`Backend analysis score: ${report.score}`)
    console.log(`Report: ${outPath}`)
  } else {
    console.log(`${report.score} ${outPath}`)
  }
  process.exit(report.findings.some(f => f.status === 'FAIL') ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
