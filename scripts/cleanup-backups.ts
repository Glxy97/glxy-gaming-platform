#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'

type Match = { src: string; rel: string }

const IGNORE_DIRS = ['node_modules', '.next', 'coverage', 'uploads', 'logs', 'backups', '.swc']
const PATTERNS = [
  // Backup/disabled suffixes
  /\.bak(\.|$)/i,
  /\.backup(\.|$)/i,
  /\.disabled$/i,
  /~$/
]

function shouldIgnore(p: string) {
  return IGNORE_DIRS.some(d => p.split(path.sep).includes(d))
}

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (shouldIgnore(full)) continue
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function findMatches(root: string): Match[] {
  const files = walk(root)
  const matches: Match[] = []
  for (const f of files) {
    const name = path.basename(f)
    if (PATTERNS.some(rx => rx.test(name))) {
      matches.push({ src: f, rel: path.relative(root, f) })
    }
  }
  return matches
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  const root = path.join(__dirname, '..')
  const destRoot = path.join(root, 'backups', `archive-${new Date().toISOString().replace(/[:.]/g, '-')}`)

  const matches = findMatches(root)
  if (matches.length === 0) {
    console.log('No backup/disabled files found.')
    return
  }

  if (!execute) {
    console.log('Dry run (no files moved). Use --execute to perform changes.')
    for (const m of matches) console.log('would-move:', m.rel)
    console.log(`Total: ${matches.length} file(s). Destination would be: ${path.relative(root, destRoot)}`)
    return
  }

  ensureDir(destRoot)
  const moved: string[] = []
  for (const m of matches) {
    const target = path.join(destRoot, m.rel.replace(/[\\/]/g, '__'))
    ensureDir(path.dirname(target))
    fs.renameSync(m.src, target)
    moved.push(m.rel)
  }
  console.log(`Moved ${moved.length} file(s) to ${path.relative(root, destRoot)}`)
}

main().catch(err => { console.error(err); process.exit(1) })

