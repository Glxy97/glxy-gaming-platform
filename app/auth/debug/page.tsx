'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DebugContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const errorDescription = searchParams?.get('error_description')
  const code = searchParams?.get('code')
  const state = searchParams?.get('state')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-6">OAuth Debug Information</h1>

          <div className="space-y-4 text-white">
            <div>
              <strong>Error:</strong> {error || 'None'}
            </div>
            <div>
              <strong>Error Description:</strong> {errorDescription || 'None'}
            </div>
            <div>
              <strong>Code:</strong> {code || 'None'}
            </div>
            <div>
              <strong>State:</strong> {state || 'None'}
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">All URL Parameters:</h2>
              <pre className="bg-black/50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(Object.fromEntries(searchParams?.entries() || []), null, 2)}
              </pre>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Expected Google OAuth Setup:</h2>
              <div className="bg-black/50 p-4 rounded text-sm">
                <p><strong>Authorized redirect URIs:</strong></p>
                <ul className="list-disc ml-6 mt-2">
                  <li>https://glxy.at/api/auth/callback/google</li>
                  <li>http://localhost:3000/api/auth/callback/google (for development)</li>
                </ul>

                <p className="mt-4"><strong>Authorized JavaScript origins:</strong></p>
                <ul className="list-disc ml-6 mt-2">
                  <li>https://glxy.at</li>
                  <li>http://localhost:3000 (for development)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }>
        <DebugContent />
      </Suspense>
    </div>
  )
}