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

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    // NULL-SAFETY: Check Redis availability
    if (!redis) {
      console.error('[THEME-PRESET] Redis client unavailable')
      return NextResponse.json({ name, tokens: null })
    }

    const raw = await redis.get(`theme:preset:${name}`)
    const tokens = raw ? JSON.parse(raw) : null
    return NextResponse.json({ name, tokens })
  } catch (error) {
    console.error('[THEME-PRESET] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const session = await auth()
    if (!isAllowedSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // NULL-SAFETY: Check Redis availability
    if (!redis) {
      console.error('[THEME-PRESET] Redis client unavailable')
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    const tokens = await req.json().catch(() => null)
    if (!tokens || typeof tokens !== 'object') return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    await redis.set(`theme:preset:${name}`, JSON.stringify(tokens))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[THEME-PRESET] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    // NULL-SAFETY: Check Redis availability
    if (!redis) {
      console.error('[THEME-PRESET] Redis client unavailable')
      return NextResponse.json({ deleted: 0 })
    }

    const count = await redis.del(`theme:preset:${name}`)
    return NextResponse.json({ deleted: count })
  } catch (error) {
    console.error('[THEME-PRESET] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
