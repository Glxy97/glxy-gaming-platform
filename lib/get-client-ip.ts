// @ts-nocheck
import { NextRequest } from 'next/server'
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  // @ts-expect-error
  return req.socket?.remoteAddress || 'unknown'
}
