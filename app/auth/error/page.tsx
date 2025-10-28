'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const errorMessages: Record<string, string> = {
  Configuration: 'Es gibt ein Problem mit der Server-Konfiguration. Bitte kontaktiere den Administrator.',
  AccessDenied: 'Du hast keinen Zugriff auf diese Ressource.',
  Verification: 'Der Verifizierungstoken ist abgelaufen oder wurde bereits verwendet.',
  Default: 'Ein unbekannter Fehler ist aufgetreten.',
  OAuthSignin: 'Fehler beim Starten der OAuth-Anmeldung.',
  OAuthCallback: 'Fehler beim Verarbeiten der OAuth-Antwort.',
  OAuthCreateAccount: 'OAuth-Account konnte nicht erstellt werden.',
  EmailCreateAccount: 'E-Mail-Account konnte nicht erstellt werden.',
  Callback: 'Fehler beim Callback-Prozess.',
  OAuthAccountNotLinked: 'Dieses Konto ist bereits mit einem anderen Anbieter verknüpft.',
  EmailSignin: 'E-Mail konnte nicht gesendet werden.',
  CredentialsSignin: 'Anmeldung fehlgeschlagen. Überprüfe deine Anmeldedaten.',
  SessionRequired: 'Bitte melde dich an, um auf diese Seite zuzugreifen.',
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || 'Default'
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="mx-auto max-w-md space-y-6 rounded-lg bg-gray-800/50 p-8 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Authentifizierungsfehler</h1>
          <p className="text-gray-400">{message}</p>
          {error === 'Configuration' && (
            <p className="text-sm text-gray-500 mt-4">
              Error Code: {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
          >
            Zurück zur Anmeldung
          </Link>
          <Link
            href="/"
            className="rounded-md border border-gray-600 px-4 py-2 text-center text-gray-300 transition-colors hover:bg-gray-700"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
