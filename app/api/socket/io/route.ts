import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Socket.IO App Router Route
 *
 * Socket.IO server is initialized in server.ts with custom HTTP server
 * This route exists for Next.js routing compatibility
 */
export async function GET(req: NextRequest) {
  return new NextResponse('Socket.IO server running on /api/socket/io', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
