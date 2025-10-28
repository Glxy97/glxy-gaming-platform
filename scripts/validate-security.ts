#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { SecurityValidatorConfig, ValidationSummary, CheckDetail } from '../agent-configs/types/security-validator.types'

function loadConfig(): SecurityValidatorConfig {
  const p = path.join(__dirname, '../agent-configs/security-validator.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function fileExists(p: string): boolean {
  try { return fs.existsSync(p) } catch { return false }
}

function readIfExists(p: string): string {
  return fileExists(p) ? fs.readFileSync(p, 'utf8') : ''
}

function summarize(details: CheckDetail[], scenario: string): ValidationSummary {
  const status = details.every(d => d.status === 'PASS') ? 'PASS' : (details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING')
  const recs: string[] = []
  if (scenario === 'headers') {
    if (details.some(d => d.test_name === 'Content Security Policy' && d.status !== 'PASS')) {
      recs.push('Add or tighten Content-Security-Policy in middleware.ts')
    }
  }
  if (scenario === 'auth') {
    if (details.some(d => d.test_name === 'NEXTAUTH_SECRET referenced' && d.status !== 'PASS')) {
      recs.push('Ensure NEXTAUTH_SECRET is configured and referenced')
    }
  }
  if (scenario === 'limits') {
    if (details.some(d => d.test_name.includes('Socket.IO') && d.status !== 'PASS')) {
      recs.push('Add Socket.IO rate limiting in connection and action handlers')
    }
  }
  return { scenario, status, details, recommendations: recs }
}

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('--quiet')
  const config = loadConfig()
  const root = path.join(__dirname, '..')

  const summaries: ValidationSummary[] = []

  // Scenario: headers
  {
    const details: CheckDetail[] = []
    const middlewarePath = path.join(root, 'middleware.ts')
    const mw = readIfExists(middlewarePath)

    const hasCSP = /Content-Security-Policy/i.test(mw)
    const hasXFO = /X-Frame-Options/i.test(mw)
    const hasXCTO = /X-Content-Type-Options/i.test(mw)
    const hasReferrer = /Referrer-Policy/i.test(mw)
    const hasPerms = /Permissions-Policy/i.test(mw)
    const hasXSS = /X-XSS-Protection/i.test(mw)

    details.push({ category: 'Headers', test_name: 'Content Security Policy', status: hasCSP ? 'PASS' : 'FAIL', message: hasCSP ? 'CSP present' : 'CSP missing', file_path: middlewarePath })
    details.push({ category: 'Headers', test_name: 'Frame/ContentType/Referrer', status: (hasXFO && hasXCTO && hasReferrer) ? 'PASS' : 'WARNING', message: `XFO:${hasXFO} XCTO:${hasXCTO} Referrer:${hasReferrer}`, file_path: middlewarePath })
    details.push({ category: 'Headers', test_name: 'Permissions Policy', status: hasPerms ? 'PASS' : 'WARNING', message: `Permissions-Policy ${hasPerms ? 'present' : 'missing'}`, file_path: middlewarePath })
    details.push({ category: 'Headers', test_name: 'XSS Protection', status: hasXSS ? 'PASS' : 'WARNING', message: `X-XSS-Protection ${hasXSS ? 'present' : 'missing'}`, file_path: middlewarePath })

    summaries.push(summarize(details, 'headers'))
  }

  // Scenario: auth
  {
    const details: CheckDetail[] = []
    const authPath = path.join(root, 'lib/auth.ts')
    const authSecPath = path.join(root, 'lib/auth-security.ts')
    const envExamplePath = path.join(root, '.env.example')
    const auth = readIfExists(authPath)
    const authSec = readIfExists(authSecPath)
    const envExample = readIfExists(envExamplePath)

    const usesJWT = /session:\s*{\s*strategy:\s*'jwt'\s*}/m.test(auth)
    const referencesSecret = /NEXTAUTH_SECRET/.test(auth) || /NEXTAUTH_SECRET/.test(envExample)
    const hasLockout = /lockedUntil/.test(authSec) && /loginAttempts/.test(authSec)
    const hasHashing = /bcrypt\.hash\(/.test(authSec) || /bcrypt\.compare\(/.test(auth)

    details.push({ category: 'Auth', test_name: 'JWT session strategy', status: usesJWT ? 'PASS' : 'FAIL', message: usesJWT ? 'JWT strategy configured' : 'JWT strategy missing', file_path: authPath })
    details.push({ category: 'Auth', test_name: 'NEXTAUTH_SECRET referenced', status: referencesSecret ? 'PASS' : 'FAIL', message: referencesSecret ? 'NEXTAUTH_SECRET present' : 'NEXTAUTH_SECRET not referenced', file_path: envExamplePath })
    details.push({ category: 'Auth', test_name: 'Account lockout/attempts', status: hasLockout ? 'PASS' : 'WARNING', message: hasLockout ? 'Lockout present' : 'Lockout features not detected', file_path: authSecPath })
    details.push({ category: 'Auth', test_name: 'Password hashing', status: hasHashing ? 'PASS' : 'FAIL', message: hasHashing ? 'bcrypt in use' : 'bcrypt usage not found', file_path: authSecPath })

    summaries.push(summarize(details, 'auth'))
  }

  // Scenario: limits
  {
    const details: CheckDetail[] = []
    const serverPath = path.join(root, 'server.ts')
    const socketImplPath = path.join(root, 'lib/socket-server.ts')
    const rateEndpointPath = path.join(root, 'app/api/rate-limit/route.ts')
    const server = readIfExists(serverPath)
    const socketImpl = readIfExists(socketImplPath)
    const rateEndpoint = fileExists(rateEndpointPath)

    // Look either in custom server or in socket implementation
    const socketRateLimit = (/rateLimit\(/.test(server) && /io\.use\(/.test(server)) || /RateLimiter\.(checkRateLimit|checkSocketConnectionLimit)\(/.test(socketImpl)
    const actionRateLimits = /game:(move|action)/.test(socketImpl) && /RateLimiter\.(checkRateLimit)/.test(socketImpl)
    const chatRateLimits = /chat:(send|message)/.test(socketImpl) && /RateLimiter\.(checkRateLimit)/.test(socketImpl)

    details.push({ category: 'Rate limiting', test_name: 'Socket.IO connection limited', status: socketRateLimit ? 'PASS' : 'FAIL', message: socketRateLimit ? 'Connection rate limiting present' : 'Connection rate limiting missing', file_path: socketRateLimit ? socketImplPath : serverPath })
    details.push({ category: 'Rate limiting', test_name: 'Game actions limited', status: actionRateLimits ? 'PASS' : 'WARNING', message: actionRateLimits ? 'Actions limited' : 'Action limits not detected', file_path: socketImplPath })
    details.push({ category: 'Rate limiting', test_name: 'Chat messages limited', status: chatRateLimits ? 'PASS' : 'WARNING', message: chatRateLimits ? 'Chat limits present' : 'Chat limits not detected', file_path: socketImplPath })
    details.push({ category: 'Rate limiting', test_name: 'API rate-limit endpoint', status: rateEndpoint ? 'PASS' : 'WARNING', message: rateEndpoint ? 'app/api/rate-limit present' : 'No app/api/rate-limit route found', file_path: rateEndpointPath })

    summaries.push(summarize(details, 'limits'))
  }

  // Print summary
  let failures = 0
  for (const s of summaries) {
    console.log(`[${s.scenario}] -> ${s.status}`)
    if (!quiet) {
      for (const d of s.details) {
        console.log(` - ${d.category} | ${d.test_name}: ${d.status} (${d.message})`)
        if (d.status === 'FAIL') failures++
      }
      if (s.recommendations.length) {
        console.log('   Recommendations:')
        s.recommendations.forEach(r => console.log(`   • ${r}`))
      }
    } else {
      for (const d of s.details) if (d.status === 'FAIL') failures++
    }
  }

  process.exit(failures > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Security validation failed:', err)
  process.exit(1)
})
