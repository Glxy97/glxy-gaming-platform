import { NextRequest, NextResponse } from 'next/server'

type DsnParts = { host: string; projectId: string }

function parseDsn(dsn?: string): DsnParts {
  if (!dsn) throw new Error('Sentry DSN not set')
  const url = new URL(dsn)
  const host = url.host
  const path = url.pathname.replace(/^\/+/, '')
  const projectId = path.split('/').pop() || ''
  if (!projectId) throw new Error('Cannot parse projectId from DSN')
  return { host, projectId }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  if (origin && !/^https:\/\/(www\.)?glxy\.at$/.test(origin)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let host: string
  let projectId: string
  try {
    const parsed = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)
    host = parsed.host
    projectId = parsed.projectId
  } catch (error: any) {
    return new NextResponse(`DSN error: ${error?.message || error}`, { status: 500 })
  }

  let body: ArrayBuffer
  try {
    body = await request.arrayBuffer()
  } catch {
    return new NextResponse('Invalid body', { status: 400 })
  }

  try {
    const upstream = await fetch(`https://${host}/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
      keepalive: true
    })

    if (upstream.ok) {
      return new NextResponse('OK', { status: 200 })
    }

    const text = await upstream.text().catch(() => '')
    return new NextResponse(`Upstream ${upstream.status}: ${text}`, { status: 502 })
  } catch (error: any) {
    return new NextResponse(`Proxy error: ${error?.message || error}`, { status: 502 })
  }
}
