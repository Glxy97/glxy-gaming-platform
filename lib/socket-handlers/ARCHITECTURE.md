# Web-Adobe Socket.IO Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐ │
│  │  React Client 1  │      │  React Client 2  │      │  React Client N  │ │
│  │                  │      │                  │      │                  │ │
│  │  useWebAdobe     │      │  useWebAdobe     │      │  useWebAdobe     │ │
│  │  Socket()        │      │  Document()      │      │  Socket()        │ │
│  └────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘ │
│           │                         │                         │           │
│           └─────────────────────────┼─────────────────────────┘           │
│                                     │                                     │
└─────────────────────────────────────┼─────────────────────────────────────┘
                                      │
                                      │ WebSocket Connection
                                      │ (wss://host/api/socket/io)
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────┐
│                           SOCKET.IO SERVER                                │
├─────────────────────────────────────┼─────────────────────────────────────┤
│                                     ▼                                     │
│                      ┌──────────────────────────┐                        │
│                      │  Socket.IO Namespace     │                        │
│                      │  /web-adobe              │                        │
│                      │                          │                        │
│                      │  ┌────────────────────┐  │                        │
│                      │  │ Authentication     │  │                        │
│                      │  │ Middleware         │  │                        │
│                      │  └────────────────────┘  │                        │
│                      │                          │                        │
│                      │  ┌────────────────────┐  │                        │
│                      │  │ Event Handlers     │  │                        │
│                      │  │                    │  │                        │
│                      │  │ • document:        │  │                        │
│                      │  │   subscribe        │  │                        │
│                      │  │ • document:        │  │                        │
│                      │  │   unsubscribe      │  │                        │
│                      │  │ • field:update     │  │                        │
│                      │  │ • sync:request     │  │                        │
│                      │  └────────────────────┘  │                        │
│                      │                          │                        │
│                      │  ┌────────────────────┐  │                        │
│                      │  │ Socket Rooms       │  │                        │
│                      │  │                    │  │                        │
│                      │  │ doc:123 ───→ [S1]  │  │                        │
│                      │  │ doc:456 ───→ [S2]  │  │                        │
│                      │  │ doc:789 ───→ [S3]  │  │                        │
│                      │  └────────────────────┘  │                        │
│                      └──────────┬───────────────┘                        │
│                                 │                                         │
│                                 │                                         │
└─────────────────────────────────┼─────────────────────────────────────────┘
                                  │
                                  │ Redis Pub/Sub
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                             REDIS LAYER                                   │
├─────────────────────────────────┼─────────────────────────────────────────┤
│                                 ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Redis Pub/Sub Channels                         │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  web-adobe:analysis:start:{docId}                                   │ │
│  │  web-adobe:analysis:progress:{docId}                                │ │
│  │  web-adobe:analysis:complete:{docId}                                │ │
│  │  web-adobe:analysis:error:{docId}                                   │ │
│  │  web-adobe:field:update:{docId}                                     │ │
│  │  web-adobe:sync:start:{docId}                                       │ │
│  │  web-adobe:sync:progress:{docId}                                    │ │
│  │  web-adobe:sync:complete:{docId}                                    │ │
│  │  web-adobe:sync:error:{docId}                                       │ │
│  │  web-adobe:sync:request:{docId}                                     │ │
│  │                                                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                          Redis Cache                                │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  web-adobe:doc:state:{docId}         → Current analysis state      │ │
│  │  web-adobe:doc:fields:{docId}        → Extracted fields (Hash)     │ │
│  │  web-adobe:doc:subscribers:{docId}   → Active socket IDs (Set)     │ │
│  │                                                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Pub/Sub Subscribe
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                          FASTAPI WORKER LAYER                             │
├─────────────────────────────────┼─────────────────────────────────────────┤
│                                 ▼                                         │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐ │
│  │  PDF Analyzer   │      │  Field          │      │  DataPad Sync   │ │
│  │  Worker         │      │  Extractor      │      │  Worker         │ │
│  │                 │      │  Worker         │      │                 │ │
│  │  • OCR          │      │  • Form Fields  │      │  • API Client   │ │
│  │  • Layout       │      │  • Validation   │      │  • Field Map    │ │
│  │  • Metadata     │      │  • Confidence   │      │  • Error Handle │ │
│  │                 │      │                 │      │                 │ │
│  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘ │
│           │                        │                        │           │
│           │                        │                        │           │
│           └────────────────────────┼────────────────────────┘           │
│                                    │                                     │
│                                    │ Redis Publish                       │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                                     ▼
                              [Redis Pub/Sub]
```

## Event Flow Diagrams

### 1. Analysis Workflow

```
FastAPI Worker                Redis                Socket.IO Server           React Client
─────────────────────────────────────────────────────────────────────────────────────────

1. Start Analysis
   │
   ├──► PUBLISH
   │    web-adobe:analysis:start:doc-123
   │                              │
   │                              ├──► SUBSCRIBE
   │                              │    (listening)
   │                              │                    │
   │                              └───────────────────►│
   │                                                    │
   │                                                    ├──► BROADCAST
   │                                                    │    to room "doc:doc-123"
   │                                                    │                          │
   │                                                    └─────────────────────────►│
   │                                                                                │
   │                                                                                ├──► onStart()
   │                                                                                │    callback

2. Progress Updates (0-100%)
   │
   ├──► PUBLISH (every page)
   │    web-adobe:analysis:progress:doc-123
   │    { progress: 45, stage: 'ocr', ... }
   │                              │
   │                              └───────────────────►│
   │                                                    │
   │                                                    ├──► CACHE
   │                                                    │    web-adobe:doc:state:doc-123
   │                                                    │
   │                                                    ├──► BROADCAST
   │                                                    │                          │
   │                                                    └─────────────────────────►│
   │                                                                                │
   │                                                                                ├──► onProgress()
   │                                                                                │    update UI

3. Complete
   │
   ├──► PUBLISH
   │    web-adobe:analysis:complete:doc-123
   │    { totalFields: 25, duration: 2500, ... }
   │                              │
   │                              └───────────────────►│
   │                                                    │
   │                                                    ├──► BROADCAST
   │                                                    │                          │
   │                                                    └─────────────────────────►│
   │                                                                                │
   │                                                                                ├──► onComplete()
   │                                                                                │    show success
```

### 2. Field Update Workflow (User-Initiated)

```
React Client              Socket.IO Server               Redis                FastAPI Worker
─────────────────────────────────────────────────────────────────────────────────────────

1. User edits field
   │
   ├──► EMIT
   │    field:update
   │    { docId: 'doc-123', fieldId: 'invoice_no', value: 'INV-001' }
   │                              │
   │                              ├──► CACHE
   │                              │    web-adobe:doc:fields:doc-123
   │                              │    HSET invoice_no {...}
   │                              │
   │                              ├──► PUBLISH
   │                              │    web-adobe:field:update:doc-123
   │                              │                    │
   │                              │                    └──────────────────────────►│
   │                              │                                                 │
   │                              │                                                 ├──► Process Update
   │                              │                                                 │    (validation, save)
   │                              │
   │                              ├──► BROADCAST to room
   │                              │    (except sender)
   │◄─────────────────────────────┘
   │
   ├──► onFieldUpdated()
   │    (other clients update UI)
```

### 3. Document Subscription Lifecycle

```
React Client              Socket.IO Server               Redis
──────────────────────────────────────────────────────────────────

1. Component Mount
   │
   ├──► CONNECT
   │    io('/web-adobe')
   │                              │
   │                              ├──► Authenticate
   │                              │    (NextAuth middleware)
   │                              │
   │                              ├──► Connection established
   │◄─────────────────────────────┘
   │
   ├──► EMIT
   │    document:subscribe
   │    { documentId: 'doc-123' }
   │                              │
   │                              ├──► JOIN room "doc:doc-123"
   │                              │
   │                              ├──► SADD
   │                              │    web-adobe:doc:subscribers:doc-123
   │                              │    socket-id-xyz
   │                              │                    │
   │                              ├──► SUBSCRIBE       │
   │                              │    Redis channels  │
   │                              │    (if first)      │
   │                              │                    │
   │                              ├──► GET             │
   │                              │    web-adobe:doc:state:doc-123
   │                              │    (send current state)
   │                              │                    │
   │◄─────────────────────────────┘◄───────────────────┘
   │
   ├──► Receive current state
   │    (if analysis in progress)

2. Component Unmount
   │
   ├──► EMIT
   │    document:unsubscribe
   │    { documentId: 'doc-123' }
   │                              │
   │                              ├──► LEAVE room "doc:doc-123"
   │                              │
   │                              ├──► SREM
   │                              │    web-adobe:doc:subscribers:doc-123
   │                              │    socket-id-xyz
   │                              │                    │
   │                              ├──► Check if empty  │
   │                              │                    │
   │                              ├──► UNSUBSCRIBE     │
   │                              │    (if no more     │
   │                              │    subscribers)    │
   │                              │                    │
   │◄─────────────────────────────┘                    │
   │
   ├──► DISCONNECT
```

## Data Flow Patterns

### Pattern 1: Broadcast to Room (Document-Specific)

```typescript
// FastAPI publishes to Redis
redis.publish('web-adobe:analysis:progress:doc-123', JSON.stringify(data))

// Socket.IO receives and routes to specific room
socket.on('message', (channel, message) => {
  const documentId = extractDocIdFromChannel(channel)
  io.of('/web-adobe')
    .to(`doc:${documentId}`)
    .emit('analysis:progress', JSON.parse(message))
})

// Only clients subscribed to doc-123 receive the event
```

### Pattern 2: Cross-Client Field Sync

```typescript
// Client A updates field
socket.emit('field:update', { docId, fieldId, value })

// Server broadcasts to room (excluding sender)
socket.to(`doc:${docId}`).emit('field:updated', fieldData)

// Client B, C, D receive update automatically
```

### Pattern 3: State Recovery on Reconnect

```typescript
// Client reconnects
socket.on('connect', () => {
  // Re-subscribe to documents
  subscribedDocuments.forEach(docId => {
    socket.emit('document:subscribe', { documentId: docId })
  })
})

// Server sends current state
socket.on('document:subscribe', async ({ documentId }) => {
  const currentState = await redis.get(`web-adobe:doc:state:${documentId}`)
  if (currentState) {
    socket.emit('analysis:progress', JSON.parse(currentState))
  }
})
```

## Scalability Considerations

### Horizontal Scaling (Multiple Socket.IO Instances)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Socket.IO   │     │ Socket.IO   │     │ Socket.IO   │
│ Instance 1  │     │ Instance 2  │     │ Instance 3  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   Pub/Sub   │
                    │   + Cache   │
                    └─────────────┘
```

**Requirements:**
- Socket.IO Redis Adapter (`socket.io-redis`)
- Shared Redis instance
- Session affinity (sticky sessions) recommended

**Implementation:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter'

const pubClient = redis.duplicate()
const subClient = redis.duplicate()

io.adapter(createAdapter(pubClient, subClient))
```

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Connection Time | < 100ms | ✅ |
| Event Latency | < 50ms | ✅ |
| Concurrent Connections | 10,000+ | Scalable |
| Memory per Connection | < 10KB | ✅ |
| Redis Pub/Sub Throughput | 100k msg/s | ✅ |

## Security Architecture

### Authentication Flow

```
Client ──► Socket.IO ──► Middleware ──► NextAuth ──► Database
                            │
                            ├──► Extract Cookie
                            ├──► Verify JWT
                            ├──► Load User
                            └──► Attach to socket.data.user
```

### Authorization Layers

1. **Connection Level:** NextAuth session validation
2. **Namespace Level:** Role-based access (if needed)
3. **Room Level:** Document ownership check
4. **Event Level:** Field-level permissions

### Data Protection

- All WebSocket connections use WSS (TLS)
- Sensitive fields encrypted in Redis
- Audit log for all field updates
- Rate limiting per socket/IP

## Monitoring & Observability

### Metrics to Track

```typescript
// Connection metrics
socket_connections_total{namespace="/web-adobe"}
socket_connections_active{namespace="/web-adobe"}

// Event metrics
socket_events_total{event="analysis:progress"}
socket_events_latency{event="field:updated"}

// Redis metrics
redis_pubsub_channels{pattern="web-adobe:*"}
redis_pubsub_messages_total
redis_cache_hits_total
redis_cache_misses_total

// Error metrics
socket_errors_total{type="connection_error"}
socket_errors_total{type="event_error"}
```

### Health Checks

```typescript
// Socket.IO health
GET /api/socket/health
{
  status: 'ok',
  namespace: '/web-adobe',
  connections: 1234,
  rooms: 567
}

// Redis health
GET /api/redis/health
{
  status: 'ok',
  latency: '5ms',
  memory: '256MB'
}
```

## Disaster Recovery

### Failover Scenarios

1. **Socket.IO Instance Failure**
   - Client auto-reconnects to another instance
   - State recovered from Redis cache
   - Active subscriptions restored

2. **Redis Failure**
   - Graceful degradation (no real-time updates)
   - Fallback to polling
   - Alert triggered

3. **FastAPI Worker Failure**
   - Job queue ensures retry
   - Error event published to clients
   - Manual intervention if needed

### Backup Strategy

- Redis persistence (RDB + AOF)
- Document state snapshots
- Event replay capability
- Field update history
