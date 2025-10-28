# Web-Adobe Socket.IO Integration

Real-time PDF analysis and DataPad synchronization using Socket.IO and Redis Pub/Sub.

## Architecture Overview

```
FastAPI Worker → Redis Pub/Sub → Socket.IO Server → React Clients
```

### Components

1. **Backend Socket.IO Namespace** (`web-adobe.ts`)
   - Namespace: `/web-adobe`
   - Redis Pub/Sub integration
   - Event routing and broadcasting

2. **React Hook** (`use-web-adobe-socket.ts`)
   - Auto-connect/disconnect
   - Typed event subscriptions
   - Document lifecycle management

3. **Test API** (`/api/web-adobe/test-analysis`)
   - Simulates FastAPI worker events
   - Demo analysis workflow

## Events

### Analysis Events

#### `analysis:start`
```typescript
{
  documentId: string
  fileName: string
  totalPages: number
  startedAt: number
  userId: string
}
```

#### `analysis:progress`
```typescript
{
  documentId: string
  progress: number              // 0-100
  currentPage: number
  totalPages: number
  stage: 'preprocessing' | 'ocr' | 'field-extraction' | 'validation'
  message?: string
}
```

#### `analysis:complete`
```typescript
{
  documentId: string
  success: true
  totalFields: number
  extractedPages: number
  duration: number
  completedAt: number
}
```

#### `analysis:error`
```typescript
{
  documentId: string
  error: string
  stage: string
  recoverable: boolean
  timestamp: number
}
```

### Field Events

#### `field:updated`
```typescript
{
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
```

### Sync Events

#### `sync:start`
```typescript
{
  documentId: string
  targetPad: string
  fieldsToSync: number
  initiatedBy: string
}
```

#### `sync:progress`
```typescript
{
  documentId: string
  progress: number
  syncedFields: number
  totalFields: number
  currentField?: string
}
```

#### `sync:complete`
```typescript
{
  documentId: string
  success: true
  syncedFields: number
  failedFields: number
  dataPadUrl: string
  duration: number
}
```

#### `sync:error`
```typescript
{
  documentId: string
  error: string
  failedFields: string[]
  recoverable: boolean
}
```

## Client Usage

### Using the Hook

```tsx
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'

function PDFAnalyzer() {
  const { subscribe, updateField, requestSync, isConnected } = useWebAdobeSocket()

  useEffect(() => {
    const cleanup = subscribe('doc-123', {
      onProgress: (data) => {
        console.log(`Progress: ${data.progress}%`)
        setProgress(data.progress)
      },
      onComplete: (data) => {
        console.log('Analysis complete!', data)
      },
      onError: (data) => {
        console.error('Analysis error:', data.error)
      },
      onFieldUpdated: (data) => {
        console.log('Field updated:', data.field)
      }
    })

    return cleanup
  }, [subscribe])

  const handleFieldUpdate = () => {
    updateField('doc-123', 'invoice_number', 'INV-2024-001')
  }

  const handleSync = () => {
    requestSync('doc-123', 'DataPad-Sales-2024')
  }

  return (
    <div>
      <button onClick={handleFieldUpdate}>Update Field</button>
      <button onClick={handleSync}>Sync to DataPad</button>
    </div>
  )
}
```

### Convenience Hook for Single Document

```tsx
import { useWebAdobeDocument } from '@/hooks/use-web-adobe-socket'

function DocumentViewer({ documentId }: { documentId: string }) {
  const { isConnected } = useWebAdobeDocument(documentId, {
    onProgress: (data) => console.log('Progress:', data.progress),
    onComplete: (data) => console.log('Complete!', data)
  })

  return <div>Connected: {isConnected}</div>
}
```

## FastAPI Worker Integration

### Publishing Events from FastAPI

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)

def publish_analysis_progress(document_id: str, progress: int):
    channel = f"web-adobe:analysis:progress:{document_id}"
    data = {
        "documentId": document_id,
        "progress": progress,
        "currentPage": 5,
        "totalPages": 10,
        "stage": "ocr",
        "message": "Extracting text..."
    }
    redis_client.publish(channel, json.dumps(data))

# Usage in FastAPI worker
async def analyze_pdf(document_id: str):
    # Start analysis
    publish_event('start', document_id, {...})

    # Update progress
    for page in pages:
        progress = (page / total_pages) * 100
        publish_analysis_progress(document_id, progress)

    # Complete
    publish_event('complete', document_id, {...})
```

### Redis Channel Naming Convention

```
web-adobe:analysis:start:{documentId}
web-adobe:analysis:progress:{documentId}
web-adobe:analysis:complete:{documentId}
web-adobe:analysis:error:{documentId}
web-adobe:field:update:{documentId}
web-adobe:sync:start:{documentId}
web-adobe:sync:progress:{documentId}
web-adobe:sync:complete:{documentId}
web-adobe:sync:error:{documentId}
```

## Testing

### 1. Start Development Server

```bash
npm run dev
```

### 2. Access Demo Page

Navigate to: `http://localhost:3000/web-adobe-demo`

### 3. Test Analysis Workflow

1. Connect to Socket.IO (automatic)
2. Enter document ID (e.g., `doc-123`)
3. Click "Start Analysis"
4. Watch real-time progress updates
5. Test field updates and sync

### 4. Test API Endpoint

```bash
curl -X POST http://localhost:3000/api/web-adobe/test-analysis \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc-123","fileName":"test.pdf","totalPages":5}'
```

### 5. Direct Socket.IO Testing

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/web-adobe', {
  path: '/api/socket/io'
})

socket.on('connect', () => {
  console.log('Connected:', socket.id)

  // Subscribe to document
  socket.emit('document:subscribe', { documentId: 'doc-123' })

  // Listen to events
  socket.on('analysis:progress', (data) => {
    console.log('Progress:', data.progress)
  })
})
```

## Monitoring

### Redis Pub/Sub Monitoring

```bash
# Monitor all web-adobe channels
redis-cli PSUBSCRIBE "web-adobe:*"
```

### Socket.IO Connection Monitoring

Check server logs for connection events:
```
✅ Web-Adobe client connected: username (socket-id)
✅ Client socket-id subscribed to document doc-123
✅ Subscribed to document doc-123 channels
❌ Web-Adobe client disconnected: socket-id
```

### Cache Inspection

```bash
# Check active subscribers for a document
redis-cli SMEMBERS "web-adobe:doc:subscribers:doc-123"

# Check document state
redis-cli GET "web-adobe:doc:state:doc-123"

# Check extracted fields
redis-cli HGETALL "web-adobe:doc:fields:doc-123"
```

## Performance Considerations

### Scalability
- Redis Pub/Sub handles cross-process communication
- Socket.IO rooms isolate document-specific events
- Automatic cleanup of inactive subscriptions
- Connection pooling for Redis

### Resource Management
- Automatic unsubscribe when no clients listening
- TTL-based cache expiration
- Graceful connection cleanup on disconnect
- Rate limiting on field updates

### Best Practices
1. Always unsubscribe when component unmounts
2. Use document-specific rooms for isolation
3. Batch field updates when possible
4. Handle reconnection gracefully
5. Monitor Redis channel subscriptions

## Troubleshooting

### Socket.IO Not Connecting
- Check server is running on correct port
- Verify CORS configuration
- Check authentication middleware
- Inspect browser console for errors

### Events Not Received
- Verify document subscription: `socket.emit('document:subscribe', { documentId })`
- Check Redis connection: `redis-cli PING`
- Monitor Redis channels: `redis-cli PSUBSCRIBE "web-adobe:*"`
- Check server logs for subscription confirmation

### Redis Connection Issues
- Ensure Redis is running: `redis-cli PING`
- Check REDIS_URL environment variable
- Verify network connectivity
- Check Redis password if configured

### Performance Issues
- Monitor Redis memory usage
- Check number of active subscriptions
- Verify cleanup on disconnect
- Review event payload sizes

## Security

### Authentication
- Socket.IO middleware validates NextAuth session
- Development mode allows unauthenticated for testing
- Production requires valid JWT token

### Authorization
- Document-level access control (implement in middleware)
- Field update permissions (implement per use case)
- Rate limiting on client events

### Data Protection
- Sensitive field values should be encrypted
- Use HTTPS in production
- Implement field-level permissions
- Audit log all field updates

## Future Enhancements

- [ ] Batch field updates
- [ ] Document collaboration (multiple users)
- [ ] Offline queue for field updates
- [ ] Real-time cursor positions
- [ ] Field validation rules
- [ ] Auto-save field changes
- [ ] Version history for documents
- [ ] PDF annotation sync
- [ ] OCR confidence thresholds
- [ ] Custom field extractors
