import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateUsername, generateRandomUsername } from '@/lib/username-generator'

/**
 * POST /api/auth/setup-username
 * Setzt oder generiert einen Benutzernamen für OAuth-Benutzer
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { username, skipSetup } = body

    let finalUsername: string

    if (skipSetup || !username) {
      // Generiere zufälligen Benutzernamen
      let randomUsername = generateRandomUsername()

      // Prüfe Verfügbarkeit und generiere neu falls notwendig
      let attempts = 0
      while (attempts < 10) {
        const existingUser = await prisma.user.findUnique({
          where: { username: randomUsername }
        })

        if (!existingUser) {
          break
        }

        randomUsername = generateRandomUsername()
        attempts++
      }

      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'Fehler bei der Generierung eines eindeutigen Benutzernamens' },
          { status: 500 }
        )
      }

      finalUsername = randomUsername
    } else {
      // Validiere benutzerdefinierten Benutzernamen
      const validation = validateUsername(username)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Prüfe Verfügbarkeit
      const existingUser = await prisma.user.findUnique({
        where: { username }
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Benutzername ist bereits vergeben' },
          { status: 400 }
        )
      }

      finalUsername = username
    }

    // Aktualisiere Benutzer in Datenbank
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username: finalUsername }
    })

    return NextResponse.json({
      success: true,
      username: finalUsername,
      message: skipSetup || !username
        ? 'Zufälliger Benutzername wurde generiert'
        : 'Benutzername erfolgreich gespeichert'
    })
  } catch (error) {
    console.error('[Username Setup] Error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
