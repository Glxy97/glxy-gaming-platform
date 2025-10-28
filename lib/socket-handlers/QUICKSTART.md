# Web-Adobe Socket.IO - Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites

```bash
# Ensure Redis is running
redis-cli ping
# Expected: PONG

# Ensure Next.js dev server is running
npm run dev
# Expected: Server running on http://localhost:3000
```

### 2. Test Socket.IO Connection

Open browser console and run:

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/web-adobe', {
  path: '/api/socket/io'
})

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id)
})
```

### 3. Open Demo Page

Navigate to: **http://localhost:3000/web-adobe-demo**

You should see:
- ✅ Green connection indicator
- Document ID input field
- Three action buttons
- Empty event log

### 4. Run First Analysis

1. Keep default document ID: `doc-123`
2. Click **"Start Analysis"** button
3. Watch the progress bar fill up
4. Observe events appearing in the log

Expected events:
```
[10:30:45] Analysis request sent to server
[10:30:45] Analysis started for demo-invoice.pdf (10 pages)
[10:30:46] Progress: 10% - preprocessing (page 1/10)
[10:30:46] Progress: 30% - ocr (page 3/10)
[10:30:47] Progress: 60% - field-extraction (page 6/10)
[10:30:47] Progress: 90% - validation (page 9/10)
[10:30:48] Analysis complete! 25 fields extracted in 2500ms
```

### 5. Test Field Update

Click **"Update Field"** button

Expected:
```
[10:31:00] Field update sent: invoice_number = INV-2024-001
[10:31:00] Field updated: invoice_number = INV-2024-001 (by user)
```

Check "Extracted Fields" panel - should show new field.

### 6. Test Multi-Client Sync

Open second browser tab with same URL:

**Tab 1:**
- Document ID: `doc-123`
- Click "Update Field"

**Tab 2:**
- Should automatically show field update in event log
- Field appears in "Extracted Fields" panel

This proves real-time sync works!

## Using in Your React Component

### Basic Usage

```tsx
'use client'

import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'
import { useState, useEffect } from 'react'

export default function MyPDFViewer() {
  const [progress, setProgress] = useState(0)
  const { subscribe, isConnected } = useWebAdobeSocket()

  useEffect(() => {
    const cleanup = subscribe('my-doc-id', {
      onProgress: (data) => {
        setProgress(data.progress)
        console.log(`Stage: ${data.stage}, Page: ${data.currentPage}`)
      },
      onComplete: (data) => {
        console.log(`Done! ${data.totalFields} fields extracted`)
      },
      onError: (data) => {
        console.error('Analysis error:', data.error)
      }
    })

    return cleanup
  }, [subscribe])

  return (
    <div>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Progress: {progress}%</p>
    </div>
  )
}
```

### Advanced: Multiple Documents

```tsx
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'

export default function MultiDocViewer({ documentIds }: { documentIds: string[] }) {
  const { subscribe } = useWebAdobeSocket()
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    const cleanups = documentIds.map(docId =>
      subscribe(docId, {
        onProgress: (data) => {
          setProgress(prev => ({ ...prev, [docId]: data.progress }))
        }
      })
    )

    return () => cleanups.forEach(cleanup => cleanup())
  }, [documentIds, subscribe])

  return (
    <div>
      {documentIds.map(id => (
        <div key={id}>
          Doc {id}: {progress[id] || 0}%
        </div>
      ))}
    </div>
  )
}
```

## FastAPI Worker Integration

### Python Setup

```bash
pip install redis
```

### Publishing Events

```python
import redis
import json
from typing import Dict, Any

# Connect to Redis
redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

def publish_event(event_type: str, document_id: str, data: Dict[str, Any]):
    """Publish event to Socket.IO via Redis Pub/Sub"""
    channel = f"web-adobe:analysis:{event_type}:{document_id}"
    redis_client.publish(channel, json.dumps(data))

# Usage in PDF analysis function
async def analyze_pdf(document_id: str, file_path: str):
    # 1. Start analysis
    publish_event('start', document_id, {
        'documentId': document_id,
        'fileName': file_path.split('/')[-1],
        'totalPages': 10,
        'startedAt': int(time.time() * 1000),
        'userId': 'worker-1'
    })

    # 2. Process pages
    for page_num in range(1, 11):
        # ... OCR and extraction logic ...

        # Publish progress
        progress = int((page_num / 10) * 100)
        publish_event('progress', document_id, {
            'documentId': document_id,
            'progress': progress,
            'currentPage': page_num,
            'totalPages': 10,
            'stage': 'ocr',
            'message': f'Processing page {page_num}...'
        })

        await asyncio.sleep(0.5)  # Simulate work

    # 3. Complete
    publish_event('complete', document_id, {
        'documentId': document_id,
        'success': True,
        'totalFields': 25,
        'extractedPages': 10,
        'duration': 5000,
        'completedAt': int(time.time() * 1000)
    })
```

### Field Updates

```python
def publish_field_update(document_id: str, field_data: Dict[str, Any]):
    """Publish field extraction result"""
    channel = f"web-adobe:field:update:{document_id}"

    data = {
        'documentId': document_id,
        'field': {
            'id': field_data['id'],
            'type': field_data['type'],
            'label': field_data['label'],
            'value': field_data['value'],
            'confidence': field_data['confidence'],
            'pageNumber': field_data['page'],
            'boundingBox': field_data.get('bbox')
        },
        'updatedBy': 'ai',
        'timestamp': int(time.time() * 1000)
    }

    redis_client.publish(channel, json.dumps(data))

# Usage
publish_field_update('doc-123', {
    'id': 'field_invoice_number',
    'type': 'text',
    'label': 'Invoice Number',
    'value': 'INV-2024-001',
    'confidence': 0.95,
    'page': 1,
    'bbox': {'x': 100, 'y': 200, 'width': 150, 'height': 30}
})
```

## Testing Checklist

### ✅ Backend Tests

```bash
# 1. Check Socket.IO server
curl http://localhost:3000/api/socket/health

# 2. Check Redis connection
redis-cli ping

# 3. Monitor Redis channels
redis-cli PSUBSCRIBE "web-adobe:*"
```

### ✅ Frontend Tests

1. Open demo page: http://localhost:3000/web-adobe-demo
2. Verify green connection indicator
3. Click "Start Analysis"
4. Confirm progress updates appear
5. Open second tab with same doc ID
6. Click "Update Field" in first tab
7. Verify event appears in second tab

### ✅ API Tests

```bash
# Test analysis simulation
curl -X POST http://localhost:3000/api/web-adobe/test-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-001",
    "fileName": "invoice.pdf",
    "totalPages": 5
  }'
```

## Common Issues & Solutions

### Issue 1: Socket Not Connecting

**Symptoms:** Red connection indicator in demo

**Solutions:**
```bash
# Check server is running
lsof -i :3000

# Check Socket.IO path
curl http://localhost:3000/api/socket/io/
# Expected: {"code":0,"message":"Transport unknown"}

# Check browser console for CORS errors
```

### Issue 2: Events Not Received

**Symptoms:** No events in log after "Start Analysis"

**Solutions:**
```bash
# Monitor Redis channels
redis-cli PSUBSCRIBE "web-adobe:*"

# Check if channels are being published to
redis-cli PUBSUB CHANNELS "web-adobe:*"

# Verify subscription in server logs
# Expected: "✅ Subscribed to document doc-123 channels"
```

### Issue 3: Field Updates Not Syncing

**Symptoms:** Field update in Tab 1 doesn't appear in Tab 2

**Solutions:**
```bash
# Check both tabs use same document ID
# Check Redis cache
redis-cli HGETALL "web-adobe:doc:fields:doc-123"

# Verify socket rooms
# Server log should show: "✅ Client {socketId} subscribed to document doc-123"
```

### Issue 4: Redis Connection Failed

**Symptoms:** Server logs show "❌ Redis connection error"

**Solutions:**
```bash
# Check Redis is running
redis-cli ping

# Check Redis URL in .env
# REDIS_URL=redis://localhost:6379

# Test connection
redis-cli -h localhost -p 6379 ping
```

## Performance Optimization

### 1. Reduce Event Frequency

```python
# Instead of publishing every page
if page_num % 2 == 0:  # Every 2 pages
    publish_event('progress', ...)
```

### 2. Batch Field Updates

```python
# Collect fields, then publish all at once
fields = []
for field in extracted_fields:
    fields.append(field)

# Publish batch
for field in fields:
    publish_field_update(document_id, field)
    await asyncio.sleep(0.1)  # Small delay
```

### 3. Enable Redis Persistence

```bash
# In redis.conf
save 900 1
save 300 10
save 60 10000

appendonly yes
```

## Monitoring

### Live Event Monitoring

```bash
# Terminal 1: Monitor all events
redis-cli PSUBSCRIBE "web-adobe:*"

# Terminal 2: Monitor specific document
redis-cli PSUBSCRIBE "web-adobe:*:doc-123"

# Terminal 3: Monitor specific event type
redis-cli PSUBSCRIBE "web-adobe:analysis:progress:*"
```

### Check Active Connections

```bash
# Redis cache check
redis-cli SMEMBERS "web-adobe:doc:subscribers:doc-123"

# Server logs
# Look for: "✅ Web-Adobe client connected"
```

### Metrics

```bash
# Redis info
redis-cli INFO stats

# Check pub/sub channels
redis-cli PUBSUB CHANNELS

# Check pub/sub patterns
redis-cli PUBSUB NUMPAT
```

## Next Steps

1. **Integrate with your PDF processing pipeline**
   - Replace test API with real FastAPI worker
   - Implement actual OCR and field extraction
   - Add error handling and retry logic

2. **Enhance UI**
   - Build custom PDF viewer component
   - Add field annotation overlay
   - Implement drag-and-drop upload

3. **Add Authentication**
   - Implement document ownership checks
   - Add role-based permissions
   - Secure WebSocket connections

4. **Scale for Production**
   - Deploy Redis cluster
   - Add Socket.IO Redis adapter
   - Implement horizontal scaling

## Resources

- **Demo Page:** http://localhost:3000/web-adobe-demo
- **Test API:** http://localhost:3000/api/web-adobe/test-analysis
- **Documentation:** `lib/socket-handlers/README.md`
- **Architecture:** `lib/socket-handlers/ARCHITECTURE.md`
- **Source Code:**
  - Backend: `lib/socket-handlers/web-adobe.ts`
  - Hook: `hooks/use-web-adobe-socket.ts`
  - Demo: `app/web-adobe-demo/page.tsx`

## Support

Check server logs for detailed error messages:
```bash
npm run dev
# Look for Socket.IO and Redis connection logs
```

Enable debug mode:
```bash
DEBUG=socket.io:* npm run dev
```

Monitor Redis in real-time:
```bash
redis-cli MONITOR
```
