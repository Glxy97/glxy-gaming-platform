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
  const raw = await redis.get('theme:active')
  const active = raw ? JSON.parse(raw) : null
  return NextResponse.json({ active })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!isAllowedSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || (typeof body !== 'object')) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  // If name is provided, expand from preset; else use tokens
  let payload = body
  if (body.name && !body.tokens) {
    const raw = await redis.get(`theme:preset:${body.name}`)
    const tokens = raw ? JSON.parse(raw) : null
    if (!tokens) return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    payload = { name: body.name, tokens }
  }
  if (!payload.tokens || typeof payload.tokens !== 'object') return NextResponse.json({ error: 'Invalid tokens' }, { status: 400 })
  await redis.set('theme:active', JSON.stringify(payload))
  return NextResponse.json({ ok: true })
}

