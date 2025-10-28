/**
 * React Hook for Web-Adobe Socket.IO Connection
 * Auto-connect/disconnect with typed events
 *
 * Usage:
 * ```tsx
 * const { subscribe, unsubscribe, updateField, requestSync, isConnected } = useWebAdobeSocket()
 *
 * useEffect(() => {
 *   const handleProgress = (data: AnalysisProgressEvent) => {
 *     console.log('Progress:', data.progress)
 *   }
 *
 *   const cleanup = subscribe('doc-123', {
 *     onProgress: handleProgress,
 *     onComplete: (data) => console.log('Complete!', data),
 *     onError: (data) => console.error('Error:', data.error)
 *   })
 *
 *   return cleanup
 * }, [])
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// Event Types (matching server-side definitions)
export interface AnalysisStartEvent {
  documentId: string
  fileName: string
  totalPages: number
  startedAt: number
  userId: string
}

export interface AnalysisProgressEvent {
  documentId: string
  progress: number
  currentPage: number
  totalPages: number
  stage: 'preprocessing' | 'ocr' | 'field-extraction' | 'validation'
  message?: string
}

export interface AnalysisCompleteEvent {
  documentId: string
  success: true
  totalFields: number
  extractedPages: number
  duration: number
  completedAt: number
}

export interface AnalysisErrorEvent {
  documentId: string
  error: string
  stage: string
  recoverable: boolean
  timestamp: number
}

export interface FieldUpdatedEvent {
  documentId: string
  field: {
    id: string
    type: 'text' | 'number' | 'date' | 'checkbox' | 'signature'
    label: string
    value: any
    confidence: number
    pageNumber: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
  updatedBy: 'ai' | 'user'
  timestamp: number
}

export interface SyncStartEvent {
  documentId: string
  targetPad: string
  fieldsToSync: number
  initiatedBy: string
}

export interface SyncProgressEvent {
  documentId: string
  progress: number
  syncedFields: number
  totalFields: number
  currentField?: string
}

export interface SyncCompleteEvent {
  documentId: string
  success: true
  syncedFields: number
  failedFields: number
  dataPadUrl: string
  duration: number
}

export interface SyncErrorEvent {
  documentId: string
  error: string
  failedFields: string[]
  recoverable: boolean
}

// Event Callbacks Interface
export interface WebAdobeEventCallbacks {
  onStart?: (data: AnalysisStartEvent) => void
  onProgress?: (data: AnalysisProgressEvent) => void
  onComplete?: (data: AnalysisCompleteEvent) => void
  onError?: (data: AnalysisErrorEvent) => void
  onFieldUpdated?: (data: FieldUpdatedEvent) => void
  onSyncStart?: (data: SyncStartEvent) => void
  onSyncProgress?: (data: SyncProgressEvent) => void
  onSyncComplete?: (data: SyncCompleteEvent) => void
  onSyncError?: (data: SyncErrorEvent) => void
}

// Server to Client Events
interface ServerToClientEvents {
  'analysis:start': (data: AnalysisStartEvent) => void
  'analysis:progress': (data: AnalysisProgressEvent) => void
  'analysis:complete': (data: AnalysisCompleteEvent) => void
  'analysis:error': (data: AnalysisErrorEvent) => void
  'field:updated': (data: FieldUpdatedEvent) => void
  'sync:start': (data: SyncStartEvent) => void
  'sync:progress': (data: SyncProgressEvent) => void
  'sync:complete': (data: SyncCompleteEvent) => void
  'sync:error': (data: SyncErrorEvent) => void
}

// Client to Server Events
interface ClientToServerEvents {
  'document:subscribe': (data: { documentId: string }) => void
  'document:unsubscribe': (data: { documentId: string }) => void
  'field:update': (data: { documentId: string; fieldId: string; value: any }) => void
  'sync:request': (data: { documentId: string; targetPad: string }) => void
}

/**
 * Hook Return Type
 */
interface UseWebAdobeSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
  subscribe: (documentId: string, callbacks: WebAdobeEventCallbacks) => () => void
  unsubscribe: (documentId: string) => void
  updateField: (documentId: string, fieldId: string, value: any) => void
  requestSync: (documentId: string, targetPad: string) => void
}

/**
 * Custom Hook for Web-Adobe Socket.IO
 */
export function useWebAdobeSocket(): UseWebAdobeSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const subscribedDocuments = useRef<Set<string>>(new Set())

  // Initialize Socket Connection
  useEffect(() => {
    // Determine Socket.IO URL (same origin by default)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

    // Create socket connection to /web-adobe namespace
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`${socketUrl}/web-adobe`, {
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Web-Adobe Socket connected:', socket.id)
      setIsConnected(true)

      // Re-subscribe to documents after reconnection
      subscribedDocuments.current.forEach((documentId) => {
        socket.emit('document:subscribe', { documentId })
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Web-Adobe Socket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Web-Adobe Socket connection error:', error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Web-Adobe Socket')
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  /**
   * Subscribe to document events
   */
  const subscribe = useCallback(
    (documentId: string, callbacks: WebAdobeEventCallbacks) => {
      const socket = socketRef.current
      if (!socket) {
        console.error('❌ Socket not initialized')
        return () => {}
      }

      // Subscribe to document
      socket.emit('document:subscribe', { documentId })
      subscribedDocuments.current.add(documentId)

      // Register event listeners
      if (callbacks.onStart) {
        socket.on('analysis:start', callbacks.onStart)
      }
      if (callbacks.onProgress) {
        socket.on('analysis:progress', callbacks.onProgress)
      }
      if (callbacks.onComplete) {
        socket.on('analysis:complete', callbacks.onComplete)
      }
      if (callbacks.onError) {
        socket.on('analysis:error', callbacks.onError)
      }
      if (callbacks.onFieldUpdated) {
        socket.on('field:updated', callbacks.onFieldUpdated)
      }
      if (callbacks.onSyncStart) {
        socket.on('sync:start', callbacks.onSyncStart)
      }
      if (callbacks.onSyncProgress) {
        socket.on('sync:progress', callbacks.onSyncProgress)
      }
      if (callbacks.onSyncComplete) {
        socket.on('sync:complete', callbacks.onSyncComplete)
      }
      if (callbacks.onSyncError) {
        socket.on('sync:error', callbacks.onSyncError)
      }

      console.log(`✅ Subscribed to document ${documentId}`)

      // Return cleanup function
      return () => {
        if (callbacks.onStart) {
          socket.off('analysis:start', callbacks.onStart)
        }
        if (callbacks.onProgress) {
          socket.off('analysis:progress', callbacks.onProgress)
        }
        if (callbacks.onComplete) {
          socket.off('analysis:complete', callbacks.onComplete)
        }
        if (callbacks.onError) {
          socket.off('analysis:error', callbacks.onError)
        }
        if (callbacks.onFieldUpdated) {
          socket.off('field:updated', callbacks.onFieldUpdated)
        }
        if (callbacks.onSyncStart) {
          socket.off('sync:start', callbacks.onSyncStart)
        }
        if (callbacks.onSyncProgress) {
          socket.off('sync:progress', callbacks.onSyncProgress)
        }
        if (callbacks.onSyncComplete) {
          socket.off('sync:complete', callbacks.onSyncComplete)
        }
        if (callbacks.onSyncError) {
          socket.off('sync:error', callbacks.onSyncError)
        }

        socket.emit('document:unsubscribe', { documentId })
        subscribedDocuments.current.delete(documentId)

        console.log(`❌ Unsubscribed from document ${documentId}`)
      }
    },
    []
  )

  /**
   * Unsubscribe from document
   */
  const unsubscribe = useCallback((documentId: string) => {
    const socket = socketRef.current
    if (!socket) return

    socket.emit('document:unsubscribe', { documentId })
    subscribedDocuments.current.delete(documentId)

    console.log(`❌ Unsubscribed from document ${documentId}`)
  }, [])

  /**
   * Update field value
   */
  const updateField = useCallback((documentId: string, fieldId: string, value: any) => {
    const socket = socketRef.current
    if (!socket) {
      console.error('❌ Socket not initialized')
      return
    }

    socket.emit('field:update', { documentId, fieldId, value })
    console.log(`✅ Updated field ${fieldId} in document ${documentId}`)
  }, [])

  /**
   * Request DataPad sync
   */
  const requestSync = useCallback((documentId: string, targetPad: string) => {
    const socket = socketRef.current
    if (!socket) {
      console.error('❌ Socket not initialized')
      return
    }

    socket.emit('sync:request', { documentId, targetPad })
    console.log(`✅ Requested sync for document ${documentId} to ${targetPad}`)
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    updateField,
    requestSync,
  }
}

/**
 * Hook for single document subscription (convenience wrapper)
 */
export function useWebAdobeDocument(
  documentId: string | null,
  callbacks: WebAdobeEventCallbacks
) {
  const { subscribe, isConnected } = useWebAdobeSocket()

  useEffect(() => {
    if (!documentId) return

    const cleanup = subscribe(documentId, callbacks)
    return cleanup
  }, [documentId, subscribe])

  return { isConnected }
}
