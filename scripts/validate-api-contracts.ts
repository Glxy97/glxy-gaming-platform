#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { ApiContractValidatorConfig, ValidationSummary, CheckDetail } from '../agent-configs/types/api-contract-validator.types'

function loadConfig(): ApiContractValidatorConfig {
  const p = path.join(__dirname, '../agent-configs/api-contract-validator.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function walk(dir: string, filter: (p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, filter, out)
    else if (filter(full)) out.push(full)
  }
  return out
}

function summarize(details: CheckDetail[], scenario: string): ValidationSummary {
  const status = details.every(d => d.status === 'PASS') ? 'PASS' : (details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING')
  const recs: string[] = []
  if (scenario === 'method_guards') {
    if (details.some(d => d.test_name.includes('pages/api') && d.status !== 'PASS')) {
      recs.push('Add req.method guards and 405 in pages/api handlers')
    }
  }
  if (scenario === 'json_responses') {
    if (details.some(d => d.test_name.includes('NextResponse.json') && d.status !== 'PASS')) {
      recs.push('Use NextResponse.json in app/api route handlers')
    }
  }
  if (scenario === 'monitoring') {
    if (details.some(d => d.status === 'FAIL')) {
      recs.push('Ensure health and metrics endpoints are present and wired')
    }
  }
  return { scenario, status, details, recommendations: recs }
}

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  loadConfig() // currently unused, but reserved for future options
  const root = path.join(__dirname, '..')

  const summaries: ValidationSummary[] = []

  // Collect files
  const pagesApi = walk(path.join(root, 'pages', 'api'), p => p.endsWith('.ts'))
  const appApi = walk(path.join(root, 'app', 'api'), p => p.endsWith('.ts') && !p.endsWith('.disabled'))

  // method_guards
  {
    const details: CheckDetail[] = []
    for (const file of pagesApi) {
      const content = fs.readFileSync(file, 'utf8')
      const checksMethod = /req\.method/.test(content)
      const returns405 = /405/.test(content)
      details.push({ category: 'pages/api', test_name: 'Method guard present', status: checksMethod ? 'PASS' : 'WARNING', message: checksMethod ? 'req.method checked' : 'No method checks found', file_path: file })
      details.push({ category: 'pages/api', test_name: '405 for disallowed methods', status: returns405 ? 'PASS' : 'WARNING', message: returns405 ? '405 present' : 'No 405 handling', file_path: file })
    }
    for (const file of appApi) {
      const content = fs.readFileSync(file, 'utf8')
      const exportsGet = /export\s+async\s+function\s+GET|export\s+function\s+GET/.test(content)
      const exportsPost = /export\s+async\s+function\s+POST|export\s+function\s+POST/.test(content)
      const hasDirectMethod = exportsGet || exportsPost || /export\s+function\s+(PUT|PATCH|DELETE)/.test(content)
      // Support re-export patterns like: export { handler as GET, handler as POST }
      const hasReExport = /export\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE)\b[^}]*\}/.test(content)
      const hasAnyMethod = hasDirectMethod || hasReExport
      details.push({ category: 'app/api', test_name: 'Method exports', status: hasAnyMethod ? 'PASS' : 'FAIL', message: hasAnyMethod ? 'Exports per method detected' : 'No method exports detected', file_path: file })
    }
    summaries.push(summarize(details, 'method_guards'))
  }

  // json_responses
  {
    const details: CheckDetail[] = []
    for (const file of pagesApi) {
      const content = fs.readFileSync(file, 'utf8')
      const jsonUsage = /res\.status\(\d+\)\.json\(/.test(content) || /res\.json\(/.test(content)
      details.push({ category: 'pages/api', test_name: 'res.status(...).json(...) used', status: jsonUsage ? 'PASS' : 'WARNING', message: jsonUsage ? 'JSON response helpers used' : 'No explicit JSON helpers detected', file_path: file })
    }
    for (const file of appApi) {
      const content = fs.readFileSync(file, 'utf8')
      const nextResp = /NextResponse\.json\(/.test(content)
      details.push({ category: 'app/api', test_name: 'NextResponse.json used', status: nextResp ? 'PASS' : 'WARNING', message: nextResp ? 'NextResponse.json present' : 'Using other response helpers', file_path: file })
    }
    summaries.push(summarize(details, 'json_responses'))
  }

  // monitoring
  {
    const details: CheckDetail[] = []
    const healthApp = fs.existsSync(path.join(root, 'app/api/health/route.ts'))
    const metricsPages = fs.existsSync(path.join(root, 'pages/api/metrics.ts'))
    const hasAPIMonLib = fs.existsSync(path.join(root, 'lib/api-monitoring.ts'))
    details.push({ category: 'Monitoring', test_name: 'Health endpoint present', status: healthApp ? 'PASS' : 'FAIL', message: healthApp ? 'app/api/health present' : 'Missing health endpoint', file_path: 'app/api/health/route.ts' })
    details.push({ category: 'Monitoring', test_name: 'Metrics endpoint present', status: metricsPages ? 'PASS' : 'WARNING', message: metricsPages ? 'pages/api/metrics present' : 'No metrics endpoint found', file_path: 'pages/api/metrics.ts' })
    details.push({ category: 'Monitoring', test_name: 'APIMonitoring library present', status: hasAPIMonLib ? 'PASS' : 'FAIL', message: hasAPIMonLib ? 'lib/api-monitoring.ts present' : 'APIMonitoring library missing', file_path: 'lib/api-monitoring.ts' })
    summaries.push(summarize(details, 'monitoring'))
  }

  // Output
  let failures = 0
  for (const s of summaries) {
    console.log(`[${s.scenario}] -> ${s.status}`)
    if (!quiet) {
      s.details.forEach(d => {
        console.log(` - ${d.category} | ${d.test_name}: ${d.status} (${d.message})`)
        if (d.status === 'FAIL') failures++
      })
      if (s.recommendations.length) {
        console.log('   Recommendations:')
        s.recommendations.forEach(r => console.log(`   • ${r}`))
      }
    } else {
      s.details.forEach(d => { if (d.status === 'FAIL') failures++ })
    }
  }

  process.exit(failures > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('API contract validation failed:', err)
  process.exit(1)
})
