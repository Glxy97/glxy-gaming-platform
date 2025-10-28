import { NextRequest, NextResponse } from 'next/server'

// Tournament feature not yet implemented - Prisma schema does not include Tournament model
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({
    error: 'Tournament feature not implemented',
    message: 'The tournament system is under development. Please check back later.'
  }, { status: 501 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({
    error: 'Tournament feature not implemented',
    message: 'The tournament system is under development. Please check back later.'
  }, { status: 501 })
}
