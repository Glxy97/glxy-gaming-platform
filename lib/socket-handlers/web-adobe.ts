/**
 * Socket.IO Event Handlers for Web-Adobe Integration
 * Real-time PDF analysis and DataPad synchronization
 *
 * Namespace: /web-adobe
 * Communication: FastAPI Worker → Redis Pub/Sub → Socket.IO
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { redis, CacheManager, CACHE_TTL } from '@/lib/redis-server'

// TypeScript Event Interfaces
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

// Redis Pub/Sub Channel Names
const REDIS_CHANNELS = {
  ANALYSIS_START: (docId: string) => `web-adobe:analysis:start:${docId}`,
  ANALYSIS_PROGRESS: (docId: string) => `web-adobe:analysis:progress:${docId}`,
  ANALYSIS_COMPLETE: (docId: string) => `web-adobe:analysis:complete:${docId}`,
  ANALYSIS_ERROR: (docId: string) => `web-adobe:analysis:error:${docId}`,
  FIELD_UPDATE: (docId: string) => `web-adobe:field:update:${docId}`,
  SYNC_START: (docId: string) => `web-adobe:sync:start:${docId}`,
  SYNC_PROGRESS: (docId: string) => `web-adobe:sync:progress:${docId}`,
  SYNC_COMPLETE: (docId: string) => `web-adobe:sync:complete:${docId}`,
  SYNC_ERROR: (docId: string) => `web-adobe:sync:error:${docId}`,
} as const

// Cache Keys for Document State
const DOC_CACHE_KEYS = {
  STATE: (docId: string) => `web-adobe:doc:state:${docId}`,
  FIELDS: (docId: string) => `web-adobe:doc:fields:${docId}`,
  SUBSCRIBERS: (docId: string) => `web-adobe:doc:subscribers:${docId}`,
} as const

/**
 * Initialize Web-Adobe Socket.IO Namespace
 */
export function initializeWebAdobeNamespace(io: SocketIOServer) {
  const webAdobeNamespace = io.of('/web-adobe')

  // Redis Subscriber for Pub/Sub
  const subscriber = redis.duplicate()

  // Track subscribed channels
  const activeChannels = new Set<string>()

  // Connect subscriber
  subscriber.connect().catch((err) => {
    console.error('❌ Redis subscriber connection failed:', err)
  })

  /**
   * Subscribe to Redis channel and emit to socket room
   */
  async function subscribeToDocument(documentId: string) {
    if (activeChannels.has(documentId)) return

    const channels = [
      REDIS_CHANNELS.ANALYSIS_START(documentId),
      REDIS_CHANNELS.ANALYSIS_PROGRESS(documentId),
      REDIS_CHANNELS.ANALYSIS_COMPLETE(documentId),
      REDIS_CHANNELS.ANALYSIS_ERROR(documentId),
      REDIS_CHANNELS.FIELD_UPDATE(documentId),
      REDIS_CHANNELS.SYNC_START(documentId),
      REDIS_CHANNELS.SYNC_PROGRESS(documentId),
      REDIS_CHANNELS.SYNC_COMPLETE(documentId),
      REDIS_CHANNELS.SYNC_ERROR(documentId),
    ]

    try {
      await subscriber.subscribe(...channels)
      activeChannels.add(documentId)
      console.log(`✅ Subscribed to document ${documentId} channels`)
    } catch (error) {
      console.error(`❌ Failed to subscribe to document ${documentId}:`, error)
    }
  }

  /**
   * Unsubscribe from Redis channel if no more listeners
   */
  async function unsubscribeFromDocument(documentId: string) {
    const subscribers = await CacheManager.smembers(DOC_CACHE_KEYS.SUBSCRIBERS(documentId))

    if (subscribers.length === 0) {
      const channels = [
        REDIS_CHANNELS.ANALYSIS_START(documentId),
        REDIS_CHANNELS.ANALYSIS_PROGRESS(documentId),
        REDIS_CHANNELS.ANALYSIS_COMPLETE(documentId),
        REDIS_CHANNELS.ANALYSIS_ERROR(documentId),
        REDIS_CHANNELS.FIELD_UPDATE(documentId),
        REDIS_CHANNELS.SYNC_START(documentId),
        REDIS_CHANNELS.SYNC_PROGRESS(documentId),
        REDIS_CHANNELS.SYNC_COMPLETE(documentId),
        REDIS_CHANNELS.SYNC_ERROR(documentId),
      ]

      try {
        await subscriber.unsubscribe(...channels)
        activeChannels.delete(documentId)
        console.log(`✅ Unsubscribed from document ${documentId} channels`)
      } catch (error) {
        console.error(`❌ Failed to unsubscribe from document ${documentId}:`, error)
      }
    }
  }

  // Redis message handler
  subscriber.on('message', (channel: string, message: string) => {
    try {
      const data = JSON.parse(message)

      // Extract document ID from channel name
      const docIdMatch = channel.match(/:([^:]+)$/)
      const documentId = docIdMatch ? docIdMatch[1] : null

      if (!documentId) {
        console.error('❌ Could not extract document ID from channel:', channel)
        return
      }

      // Route message to appropriate event
      if (channel.includes(':analysis:start:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('analysis:start', data)
      } else if (channel.includes(':analysis:progress:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('analysis:progress', data)
      } else if (channel.includes(':analysis:complete:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('analysis:complete', data)
      } else if (channel.includes(':analysis:error:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('analysis:error', data)
      } else if (channel.includes(':field:update:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('field:updated', data)
      } else if (channel.includes(':sync:start:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('sync:start', data)
      } else if (channel.includes(':sync:progress:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('sync:progress', data)
      } else if (channel.includes(':sync:complete:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('sync:complete', data)
      } else if (channel.includes(':sync:error:')) {
        webAdobeNamespace.to(`doc:${documentId}`).emit('sync:error', data)
      }
    } catch (error) {
      console.error('❌ Error processing Redis message:', error)
    }
  })

  // Connection handler
  webAdobeNamespace.on('connection', (socket: Socket) => {
    const user = socket.data.user
    console.log(`✅ Web-Adobe client connected: ${user?.username || 'Anonymous'} (${socket.id})`)

    // Document subscription
    socket.on('document:subscribe', async ({ documentId }) => {
      try {
        // Join socket room
        await socket.join(`doc:${documentId}`)

        // Track subscriber
        await CacheManager.sadd(DOC_CACHE_KEYS.SUBSCRIBERS(documentId), socket.id)

        // Subscribe to Redis channels
        await subscribeToDocument(documentId)

        // Send current state if available
        const currentState = await CacheManager.get(DOC_CACHE_KEYS.STATE(documentId))
        if (currentState) {
          socket.emit('analysis:progress', currentState)
        }

        console.log(`✅ Client ${socket.id} subscribed to document ${documentId}`)
      } catch (error) {
        console.error(`❌ Error subscribing to document ${documentId}:`, error)
        socket.emit('error', { message: 'Failed to subscribe to document' })
      }
    })

    // Document unsubscription
    socket.on('document:unsubscribe', async ({ documentId }) => {
      try {
        // Leave socket room
        await socket.leave(`doc:${documentId}`)

        // Remove from subscribers
        await CacheManager.srem(DOC_CACHE_KEYS.SUBSCRIBERS(documentId), socket.id)

        // Unsubscribe from Redis if no more subscribers
        await unsubscribeFromDocument(documentId)

        console.log(`✅ Client ${socket.id} unsubscribed from document ${documentId}`)
      } catch (error) {
        console.error(`❌ Error unsubscribing from document ${documentId}:`, error)
      }
    })

    // Field update from client
    socket.on('field:update', async ({ documentId, fieldId, value }) => {
      try {
        const fieldUpdate: FieldUpdatedEvent = {
          documentId,
          field: {
            id: fieldId,
            type: 'text', // Type should be retrieved from document state
            label: fieldId,
            value,
            confidence: 1.0, // User-edited = 100% confidence
            pageNumber: 0,
          },
          updatedBy: 'user',
          timestamp: Date.now(),
        }

        // Store in cache
        await CacheManager.hset(
          DOC_CACHE_KEYS.FIELDS(documentId),
          fieldId,
          fieldUpdate.field,
          CACHE_TTL.LONG
        )

        // Publish to Redis for FastAPI worker
        await redis.publish(
          REDIS_CHANNELS.FIELD_UPDATE(documentId),
          JSON.stringify(fieldUpdate)
        )

        // Broadcast to other clients
        socket.to(`doc:${documentId}`).emit('field:updated', fieldUpdate)

        console.log(`✅ Field ${fieldId} updated in document ${documentId}`)
      } catch (error) {
        console.error(`❌ Error updating field ${fieldId}:`, error)
        socket.emit('error', { message: 'Failed to update field' })
      }
    })

    // Sync request from client
    socket.on('sync:request', async ({ documentId, targetPad }) => {
      try {
        const syncRequest = {
          documentId,
          targetPad,
          initiatedBy: user?.id || 'anonymous',
          timestamp: Date.now(),
        }

        // Publish sync request to FastAPI worker
        await redis.publish(
          `web-adobe:sync:request:${documentId}`,
          JSON.stringify(syncRequest)
        )

        console.log(`✅ Sync request initiated for document ${documentId} to ${targetPad}`)
      } catch (error) {
        console.error(`❌ Error requesting sync for document ${documentId}:`, error)
        socket.emit('sync:error', {
          documentId,
          error: 'Failed to initiate sync',
          failedFields: [],
          recoverable: true,
        })
      }
    })

    // Disconnect handler
    socket.on('disconnect', async () => {
      try {
        // Get all subscribed documents for this socket
        const pattern = DOC_CACHE_KEYS.SUBSCRIBERS('*')
        const keys = await redis.keys(pattern)

        for (const key of keys) {
          const members = await CacheManager.smembers(key)
          if (members.includes(socket.id)) {
            const documentId = key.split(':').pop()
            if (documentId) {
              await CacheManager.srem(key, socket.id)
              await unsubscribeFromDocument(documentId)
            }
          }
        }

        console.log(`❌ Web-Adobe client disconnected: ${socket.id}`)
      } catch (error) {
        console.error('❌ Error handling disconnect:', error)
      }
    })
  })

  console.log('✅ Web-Adobe namespace initialized on /web-adobe')

  return webAdobeNamespace
}

/**
 * Helper function to publish events from FastAPI workers
 * (Can be used by API routes to simulate FastAPI events)
 */
export async function publishAnalysisEvent(
  documentId: string,
  eventType: 'start' | 'progress' | 'complete' | 'error',
  data: any
) {
  const channelMap = {
    start: REDIS_CHANNELS.ANALYSIS_START(documentId),
    progress: REDIS_CHANNELS.ANALYSIS_PROGRESS(documentId),
    complete: REDIS_CHANNELS.ANALYSIS_COMPLETE(documentId),
    error: REDIS_CHANNELS.ANALYSIS_ERROR(documentId),
  }

  const channel = channelMap[eventType]

  try {
    await redis.publish(channel, JSON.stringify(data))

    // Also cache current state for new subscribers
    if (eventType === 'progress') {
      await CacheManager.set(DOC_CACHE_KEYS.STATE(documentId), data, CACHE_TTL.MEDIUM)
    }

    console.log(`✅ Published ${eventType} event for document ${documentId}`)
  } catch (error) {
    console.error(`❌ Failed to publish ${eventType} event:`, error)
  }
}
