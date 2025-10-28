/**
 * Web-Adobe Socket.IO Demo Page
 * Demonstrates real-time PDF analysis and DataPad synchronization
 */

'use client'

import { useState, useEffect } from 'react'
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'
import type {
  AnalysisStartEvent,
  AnalysisProgressEvent,
  AnalysisCompleteEvent,
  AnalysisErrorEvent,
  FieldUpdatedEvent,
} from '@/hooks/use-web-adobe-socket'

export default function WebAdobeDemoPage() {
  const [documentId, setDocumentId] = useState('doc-123')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [analysisMessage, setAnalysisMessage] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [fields, setFields] = useState<Record<string, any>>({})

  const { subscribe, unsubscribe, updateField, requestSync, isConnected } = useWebAdobeSocket()

  // Subscribe to document events
  useEffect(() => {
    if (!documentId) return

    const cleanup = subscribe(documentId, {
      onStart: (data: AnalysisStartEvent) => {
        setIsAnalyzing(true)
        setAnalysisProgress(0)
        addEvent(`Analysis started for ${data.fileName} (${data.totalPages} pages)`)
      },

      onProgress: (data: AnalysisProgressEvent) => {
        setAnalysisProgress(data.progress)
        setAnalysisStage(data.stage)
        setAnalysisMessage(data.message || '')
        addEvent(`Progress: ${data.progress}% - ${data.stage} (page ${data.currentPage}/${data.totalPages})`)
      },

      onComplete: (data: AnalysisCompleteEvent) => {
        setIsAnalyzing(false)
        setAnalysisProgress(100)
        addEvent(`Analysis complete! ${data.totalFields} fields extracted in ${data.duration}ms`)
      },

      onError: (data: AnalysisErrorEvent) => {
        setIsAnalyzing(false)
        addEvent(`Error in ${data.stage}: ${data.error} (recoverable: ${data.recoverable})`)
      },

      onFieldUpdated: (data: FieldUpdatedEvent) => {
        setFields((prev) => ({
          ...prev,
          [data.field.id]: data.field,
        }))
        addEvent(`Field updated: ${data.field.label} = ${data.field.value} (by ${data.updatedBy})`)
      },

      onSyncStart: (data) => {
        addEvent(`Sync started to ${data.targetPad}: ${data.fieldsToSync} fields`)
      },

      onSyncProgress: (data) => {
        addEvent(`Sync progress: ${data.progress}% (${data.syncedFields}/${data.totalFields})`)
      },

      onSyncComplete: (data) => {
        addEvent(`Sync complete! ${data.syncedFields} fields synced, ${data.failedFields} failed`)
      },

      onSyncError: (data) => {
        addEvent(`Sync error: ${data.error} (${data.failedFields.length} fields failed)`)
      },
    })

    return cleanup
  }, [documentId, subscribe])

  const addEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setEvents((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
  }

  const handleStartAnalysis = async () => {
    try {
      const response = await fetch('/api/web-adobe/test-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          fileName: 'demo-invoice.pdf',
          totalPages: 10,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start analysis')
      }

      addEvent('Analysis request sent to server')
    } catch (error) {
      addEvent(`Error: ${error}`)
    }
  }

  const handleUpdateField = () => {
    updateField(documentId, 'field_invoice_number', 'INV-2024-001')
    addEvent('Field update sent: invoice_number = INV-2024-001')
  }

  const handleRequestSync = () => {
    requestSync(documentId, 'DataPad-Sales-2024')
    addEvent('Sync request sent to DataPad-Sales-2024')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Web-Adobe Socket.IO Demo
        </h1>

        {/* Connection Status */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to /web-adobe' : 'Disconnected'}
          </span>
        </div>

        {/* Document ID Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document ID
          </label>
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter document ID"
          />
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Analysis Progress</h2>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{analysisStage}</span>
                <span>{analysisProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
            {analysisMessage && (
              <p className="text-sm text-gray-500 mt-2">{analysisMessage}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleStartAnalysis}
            disabled={!isConnected || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Start Analysis
          </button>
          <button
            onClick={handleUpdateField}
            disabled={!isConnected}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Update Field
          </button>
          <button
            onClick={handleRequestSync}
            disabled={!isConnected}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Request Sync
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Event Log</h2>
            <div className="h-96 overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">No events yet...</p>
              ) : (
                events.map((event, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded"
                  >
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Extracted Fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Extracted Fields</h2>
            <div className="h-96 overflow-y-auto space-y-3">
              {Object.keys(fields).length === 0 ? (
                <p className="text-gray-500 text-sm">No fields extracted yet...</p>
              ) : (
                Object.entries(fields).map(([id, field]) => (
                  <div key={id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{field.label}</span>
                      <span className="text-xs text-gray-500">
                        {(field.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{String(field.value)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Page {field.pageNumber} | {field.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">API Usage</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1. Connect to namespace:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                io(&apos;/web-adobe&apos;)
              </code>
            </p>
            <p>
              <strong>2. Subscribe:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                socket.emit(&apos;document:subscribe&apos;, &#123; documentId: &apos;doc-123&apos; &#125;)
              </code>
            </p>
            <p>
              <strong>3. Listen:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                socket.on(&apos;analysis:progress&apos;, handler)
              </code>
            </p>
            <p>
              <strong>4. Test endpoint:</strong>{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                POST /api/web-adobe/test-analysis
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
