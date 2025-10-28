'use client'

import { useEffect, useState } from 'react'

export default function APIDocsPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load API spec:', err)
        setError('Failed to load API documentation')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-blue-600 text-white py-6 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">GLXY Gaming Platform API</h1>
          <p className="text-blue-100">
            Complete API documentation for developers
          </p>
          <div className="mt-4 flex space-x-4 text-sm">
            <a 
              href="/api/docs" 
              target="_blank"
              className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded transition-colors"
            >
              📄 Download OpenAPI JSON
            </a>
            <a 
              href="https://github.com/glxy97/glxy-gaming-platform" 
              target="_blank"
              className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded transition-colors"
            >
              📚 GitHub Repository
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">API Specification</h2>
          <p className="text-gray-600 mb-4">
            For the best experience, view this API documentation in a Swagger/OpenAPI viewer like:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>
              <a 
                href="https://editor.swagger.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Swagger Editor
              </a> (paste the spec from /api/docs)
            </li>
            <li>
              <a 
                href="https://www.postman.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Postman
              </a> (import the spec)
            </li>
            <li>Use a REST client with OpenAPI support</li>
          </ul>
          
          <div className="bg-gray-100 p-4 rounded border border-gray-200 overflow-auto max-h-96">
            <pre className="text-sm text-gray-800">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-6 px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-600 text-sm">
          <p>© 2025 GLXY Gaming Platform. All rights reserved.</p>
          <p className="mt-2">
            Built with Next.js, Prisma, Socket.IO, and NextAuth
          </p>
        </div>
      </footer>
    </div>
  )
}

