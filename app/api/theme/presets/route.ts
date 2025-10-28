import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redis } from '@/lib/redis-server'

function isAllowedSession(session: any) {
  const email = session?.user?.email || ''
  const id = session?.user?.id || ''
  const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
  const allowedIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  return (!!email && allowedEmails.includes(email)) || (!!id && allowedIds.includes(id))
}

export async function GET() {
  const keys = await redis.keys('theme:preset:*')
  const names = keys.map(k => k.replace('theme:preset:', ''))
  return NextResponse.json({ presets: names })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAllowedSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim()
  const tokens = body?.tokens
  if (!name || !tokens || typeof tokens !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  await redis.set(`theme:preset:${name}`, JSON.stringify(tokens))
  return NextResponse.json({ ok: true })
}

