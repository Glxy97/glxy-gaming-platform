# Adobe PDF Field Update API

Endpoint für Form-Field-Updates aus Adobe PDF Embed API mit Echtzeit-Synchronisation über Socket.IO.

## Endpoint

```
PUT /api/web-adobe/documents/[id]/fields
```

## Funktionalität

- **Empfang von Field-Updates** aus Adobe PDF Embed API
- **Persistierung** in Prisma/PostgreSQL
- **Real-time Events** via Redis Pub/Sub & Socket.IO
- **Validierung** mit Zod Schema
- **Authentifizierung** mit NextAuth
- **Ownership Verification** für Dokumentzugriff

## Request Format

### Headers
```
Content-Type: application/json
Cookie: [NextAuth Session Cookie]
```

### Body
```typescript
{
  "fieldName": "firstName",         // Required: PDF field name
  "value": "John",                   // Required: string | number | boolean
  "position": {                      // Optional: Normalized coordinates (0-1)
    "x": 0.25,
    "y": 0.5,
    "width": 0.2,
    "height": 0.03
  },
  "confidence": 0.95                 // Optional: 0-1, Adobe's confidence score
}
```

## Response Format

### Success (200 OK)
```typescript
{
  "success": true,
  "field": {
    "id": "cm1abc123...",
    "pdfName": "firstName",
    "displayLabel": "First Name",
    "fieldType": "text",
    "x": 0.25,
    "y": 0.5,
    "width": 0.2,
    "height": 0.03,
    "pageNumber": 1,
    "status": "DRAFT",
    "updatedAt": "2024-10-07T19:00:00.000Z"
  },
  "updatedBy": "adobe",
  "timestamp": 1728329000000
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid field update data",
  "details": [
    { "field": "fieldName", "message": "Field name is required" }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized - Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden - You do not own this document"
}
```

#### 404 Not Found
```json
{
  "error": "Document not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to update field",
  "message": "Detailed error message"
}
```

## Architecture

### Database Flow
1. Prüfung der Authentifizierung (NextAuth Session)
2. Validierung des Request Body (Zod)
3. Ownership-Verification (Prisma Query)
4. Field Update/Create (Prisma Transaction)
5. Document Status Update (DRAFT → REVIEW)

### Real-time Flow
1. Redis Pub/Sub Event: `web-adobe:field:update:${documentId}`
2. Socket.IO Namespace: `/web-adobe`
3. Room Broadcast: `doc:${documentId}`
4. Client Event: `field:updated`

### Field Type Inference
Der Endpoint erkennt automatisch Feldtypen basierend auf dem Wert:

- `boolean` → `checkbox`
- `number` → `number`
- Email-Format → `email`
- Datum-Format → `date`
- Fallback → `text`

## Client Integration

### Option 1: Direkt mit Fetch API
```typescript
const response = await fetch(`/api/web-adobe/documents/${docId}/fields`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fieldName: 'signature',
    value: signatureDataUrl,
    position: { x: 0.5, y: 0.8, width: 0.2, height: 0.05 },
    confidence: 0.98
  }),
  credentials: 'include'
})

const result = await response.json()
```

### Option 2: Mit AdobeFieldUpdater Utility
```typescript
import { AdobeFieldUpdater } from '@/lib/web-adobe/adobe-field-updater'

const updater = new AdobeFieldUpdater(documentId)

const result = await updater.updateField('firstName', 'John', {
  position: { x: 0.25, y: 0.5, width: 0.2, height: 0.03 },
  confidence: 0.95
})
```

### Option 3: Mit React Hook
```typescript
import { useAdobeFieldUpdater } from '@/hooks/use-adobe-field-updater'

const { updateField, isUpdating, error } = useAdobeFieldUpdater(documentId, {
  onSuccess: (response) => console.log('Updated:', response),
  onError: (error) => console.error('Failed:', error),
  autoRetry: true,
  maxRetries: 3
})

await updateField('lastName', 'Doe')
```

### Option 4: Batch Updates
```typescript
const updater = new AdobeFieldUpdater(documentId)

const result = await updater.batchUpdate([
  { fieldName: 'firstName', value: 'John' },
  { fieldName: 'lastName', value: 'Doe' },
  { fieldName: 'age', value: 30 }
])

console.log(`Success: ${result.successful.length}, Failed: ${result.failed.length}`)
```

## Socket.IO Integration

### Client-Side Listener
```typescript
import { useWebAdobeSocket } from '@/hooks/use-web-adobe-socket'

const { subscribe } = useWebAdobeSocket()

useEffect(() => {
  const cleanup = subscribe(documentId, {
    onFieldUpdated: (event) => {
      console.log('Field updated:', event.field.label, '=', event.field.value)
      // Update local state or UI
    }
  })

  return cleanup
}, [documentId])
```

## Security Features

### Authentication
- NextAuth Session Cookie erforderlich
- Automatische User ID Extraktion

### Authorization
- Document Ownership Verification
- Nur Document Owner kann Fields updaten

### Input Validation
- Zod Schema für Request Body
- Position Koordinaten normalisiert (0-1)
- Confidence Score limitiert (0-1)
- Field Name Sanitization

### SQL Injection Prevention
- Prisma ORM mit prepared statements
- Keine rohen SQL Queries

## Performance Optimizations

### Database
- Indexed `documentId` und `pdfName` für schnelle Lookups
- Upsert Pattern (Find or Create)
- Optimized Prisma Queries mit `select`

### Caching
- Redis für Socket.IO Event Distribution
- Field State Cache für neue Subscribers

### Concurrency
- Prisma Transaktionen für atomare Updates
- Redis Pub/Sub für horizontale Skalierung

## Error Handling

### Database Errors
- Automatisches Rollback bei Prisma Errors
- Graceful Degradation bei Redis Failures

### Validation Errors
- Detaillierte Fehlermeldungen mit Feldname
- HTTP 400 mit strukturiertem Error Format

### Network Errors
- Retry-Logic im Client (AdobeFieldUpdater)
- Exponential Backoff für Failed Requests

## Monitoring & Logging

### Console Logs
```
✅ Published field:updated event for field cm1abc123...
❌ Redis publish failed: Connection timeout
```

### Error Tracking
- Detaillierte Error Messages in Response
- Stack Traces in Server Console

## Testing

### Unit Tests
```typescript
// Test field type inference
expect(inferFieldType(true)).toBe('checkbox')
expect(inferFieldType(42)).toBe('number')
expect(inferFieldType('test@example.com')).toBe('email')
```

### Integration Tests
```typescript
// Test API endpoint
const response = await PUT('/api/web-adobe/documents/test-id/fields', {
  fieldName: 'testField',
  value: 'testValue'
})

expect(response.status).toBe(200)
expect(response.body.success).toBe(true)
```

### E2E Tests
- Adobe PDF Embed API Integration
- Socket.IO Event Reception
- Multi-User Collaboration Scenarios

## Related Files

### API Routes
- `route.ts` - Haupt-Endpoint Implementation
- `../route.ts` - Document CRUD Operations

### Libraries
- `@/lib/web-adobe/adobe-field-updater.ts` - Client Utility
- `@/lib/web-adobe/field-mapper.ts` - Field Transformation
- `@/lib/socket-handlers/web-adobe.ts` - Socket.IO Handlers

### Hooks
- `@/hooks/use-adobe-field-updater.ts` - React Hook
- `@/hooks/use-web-adobe-socket.ts` - Socket.IO Hook

### Types
- `@/types/web-adobe.ts` - TypeScript Definitions

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-password"

# Auth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Docker
```yaml
services:
  app:
    environment:
      - DATABASE_URL
      - REDIS_URL
      - NEXTAUTH_SECRET
```

## Troubleshooting

### Field Updates not saving
1. Prüfe NextAuth Session Cookie
2. Verifiziere Document Ownership
3. Checke Prisma Connection

### Socket.IO Events not received
1. Redis Connection Status prüfen
2. Socket.IO Namespace `/web-adobe` korrekt?
3. Room Subscription mit `document:subscribe`

### Type Inference nicht korrekt
1. Validiere Input Value Format
2. Prüfe `inferFieldType()` Logic
3. Setze explizit `fieldType` in Request

## Support

Bei Fragen oder Problemen:
- GitHub Issues: [Your Repo]
- Dokumentation: `/docs/web-adobe`
- API Reference: `/api/docs`
