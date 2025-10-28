import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const NOT_IMPLEMENTED = {
  error: 'Freundschaftsfunktionen sind derzeit deaktiviert.'
} as const

async function ensureSession(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(_request: NextRequest) {
  const unauthorized = await ensureSession()
  if (unauthorized) return unauthorized
  return NextResponse.json(NOT_IMPLEMENTED, { status: 501 })
}

export async function POST(_request: NextRequest) {
  const unauthorized = await ensureSession()
  if (unauthorized) return unauthorized
  return NextResponse.json(NOT_IMPLEMENTED, { status: 501 })
}

export async function PUT(_request: NextRequest) {
  const unauthorized = await ensureSession()
  if (unauthorized) return unauthorized
  return NextResponse.json(NOT_IMPLEMENTED, { status: 501 })
}
