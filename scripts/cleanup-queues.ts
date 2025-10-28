#!/usr/bin/env tsx
import redis from '@/lib/redis-server'

async function cleanupQueue(gameType: string) {
  const key = `mm:queue:${gameType}`
  const list = await redis.lrange(key, 0, -1)
  if (!list.length) return { gameType, kept: 0, removed: 0 }
  const keep: string[] = []
  let removed = 0
  for (const id of list) {
    const present = await redis.exists(`mm:present:${gameType}:${id}`)
    if (present === 1 && !keep.includes(id)) keep.push(id)
    else removed++
  }
  // Rewrite list (right side will preserve order approx.)
  await redis.del(key)
  if (keep.length) await redis.rpush(key, ...keep)
  return { gameType, kept: keep.length, removed }
}

async function main() {
  const games = ['chess','racing','uno','fps']
  const results = [] as any[]
  for (const g of games) results.push(await cleanupQueue(g))
  console.log(JSON.stringify({ results }, null, 2))
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })

