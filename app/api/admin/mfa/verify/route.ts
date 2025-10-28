import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
function isAdminSession(session: any) {
  const email = session?.user?.email || ''
  const id = session?.user?.id || ''
  const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
  const allowedIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  return (!!email && allowedEmails.includes(email)) || (!!id && allowedIds.includes(id))
}

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session || !isAdminSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    error: 'MFA-Verwaltung ist derzeit deaktiviert.',
  }, { status: 501 })
}
