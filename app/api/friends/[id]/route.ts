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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  const unauthorized = await ensureSession()
  if (unauthorized) return unauthorized
  return NextResponse.json(NOT_IMPLEMENTED, { status: 501 })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  const unauthorized = await ensureSession()
  if (unauthorized) return unauthorized
  return NextResponse.json(NOT_IMPLEMENTED, { status: 501 })
}
