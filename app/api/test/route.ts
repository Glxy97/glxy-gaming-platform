import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  console.log('🧪 Test endpoint called')
  return NextResponse.json({ 
    success: true, 
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('🧪 Test POST endpoint called')
  const body = await request.json().catch(() => null)
  return NextResponse.json({ 
    success: true, 
    message: 'Test endpoint is working!',
    body,
    timestamp: new Date().toISOString()
  })
}