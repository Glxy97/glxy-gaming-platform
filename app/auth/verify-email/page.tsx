'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams?.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Kein Verifikations-Token gefunden.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)
          setUsername(data.data?.username || '')

          setTimeout(() => {
            router.push('/auth/signin?message=verified')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verifikation fehlgeschlagen')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-6">
              🎮 GLXY Gaming
            </h1>

            {status === 'loading' && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <h2 className="text-xl font-semibold text-white">
                  E-Mail wird verifiziert...
                </h2>
                <p className="text-gray-300">
                  Einen Moment bitte, wir verifizieren deine E-Mail-Adresse.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-xl font-semibold text-green-400">
                  E-Mail erfolgreich verifiziert!
                </h2>
                <p className="text-gray-300">
                  Willkommen bei GLXY Gaming, {username}!
                </p>
                <p className="text-gray-400 text-sm">
                  Du wirst automatisch zur Anmeldung weitergeleitet...
                </p>
                <div className="mt-6">
                  <Link
                    href="/auth/signin"
                    className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Jetzt anmelden
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-xl font-semibold text-red-400">
                  Verifikation fehlgeschlagen
                </h2>
                <p className="text-gray-300">
                  {message}
                </p>
                <div className="space-y-2 mt-6">
                  <Link
                    href="/auth/signin"
                    className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 mr-3"
                  >
                    Zur Anmeldung
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
                  >
                    Neu registrieren
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
