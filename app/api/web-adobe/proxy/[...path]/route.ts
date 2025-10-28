/**
 * Web-Adobe API Proxy
 * Proxies requests to the FastAPI backend service
 */

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.WEB_ADOBE_API_URL || 'http://web-adobe-api:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params
  const pathString = path.join('/')
  const url = new URL(request.url)
  const queryString = url.search

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/${pathString}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user.id || '',
        'X-User-Email': session.user.email || '',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('FastAPI proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with Web-Adobe service' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params
  const pathString = path.join('/')
  const body = await request.json()

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/${pathString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user.id || '',
        'X-User-Email': session.user.email || '',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('FastAPI proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with Web-Adobe service' },
      { status: 500 }
    )
  }
}
