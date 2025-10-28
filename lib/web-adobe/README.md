# Web-Adobe PDF Field Extraction Service

Automatische Erkennung und Extraktion von Formularfeldern aus PDF-Dokumenten mit Echtzeit-Fortschrittsanzeige via Socket.IO.

## Features

- **Automatische Felderkennung**: Text, Checkbox, Dropdown, Signature, Number, Date
- **Bounding Box Extraktion**: Präzise Position und Größe jedes Feldes
- **Zwei Erkennungsmodi**:
  - Native Form Fields (pdf-lib) - 100% Konfidenz
  - Text-basierte Erkennung (PDF.js) - 70% Konfidenz
- **Background Processing**: Non-blocking Analyse
- **Real-time Updates**: Socket.IO Events für Progress-Tracking
- **Database Persistence**: Automatisches Speichern in Prisma DB
- **Deduplication**: Intelligentes Merging von überlappenden Feldern

## Architektur

```
┌─────────────────┐
│  Upload API     │  POST /api/web-adobe/upload
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Save to Disk   │  uploads/pdfs/[uuid]-[filename].pdf
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Create DB      │  PdfDocument (status: DRAFT)
│  Entry          │
└────────┬────────┘
         │
         v (Background)
┌─────────────────┐
│  analyzeDocument│  field-analysis-worker.ts
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Extract Fields │  pdf-field-extractor.ts
│                 │  - Load PDF
│                 │  - Detect form fields
│                 │  - Calculate bounding boxes
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Save Fields    │  PdfField table
│  to DB          │  - x, y, width, height (normalized)
│                 │  - fieldType, confidence
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Socket.IO      │  Real-time progress events
│  Events         │  - analysis:start
│                 │  - analysis:progress (0-100%)
│                 │  - analysis:complete
│                 │  - analysis:error
└─────────────────┘
```

## Usage

### 1. Upload PDF (Auto-Trigger)

```typescript
// Client-side upload
const formData = new FormData()
formData.append('file', pdfFile)

const response = await fetch('/api/web-adobe/upload', {
  method: 'POST',
  body: formData,
})

const { document } = await response.json()
// Analysis starts automatically in background
```

### 2. Listen to Socket.IO Events

```typescript
import { io } from 'socket.io-client'

const socket = io('/web-adobe')

// Subscribe to document updates
socket.emit('document:subscribe', { documentId })

// Listen to progress events
socket.on('analysis:start', (data) => {
  console.log('Analysis started:', data.fileName)
})

socket.on('analysis:progress', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.message}`)
})

socket.on('analysis:complete', (data) => {
  console.log(`Analysis complete! Found ${data.totalFields} fields`)
})

socket.on('analysis:error', (data) => {
  console.error('Analysis failed:', data.error)
})
```

### 3. Manual Trigger (Optional)

```typescript
// Trigger analysis manually
const response = await fetch(`/api/web-adobe/analyze/${documentId}`, {
  method: 'POST',
})

// Response: 202 Accepted (Background job)
```

### 4. Check Status

```typescript
// GET analysis status
const response = await fetch(`/api/web-adobe/analyze/${documentId}`)
const status = await response.json()

console.log(status.fieldCount) // Number of extracted fields
console.log(status.status) // DRAFT, ANALYZING, REVIEW, SYNCED, ERROR
```

## API Endpoints

### POST /api/web-adobe/upload

Upload PDF file and auto-trigger analysis.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (PDF)
- Max Size: 10MB

**Response:** 201 Created
```json
{
  "success": true,
  "document": {
    "id": "clxy123...",
    "title": "Form Application",
    "filename": "uuid-form.pdf",
    "status": "DRAFT",
    "fileSize": 245678
  },
  "message": "File uploaded successfully. Analysis started in background."
}
```

### POST /api/web-adobe/analyze/[documentId]

Manually trigger or re-trigger analysis.

**Response:** 202 Accepted
```json
{
  "success": true,
  "message": "Analysis started. Connect to Socket.IO for progress updates.",
  "documentId": "clxy123...",
  "isReanalysis": false,
  "socketNamespace": "/web-adobe",
  "socketEvent": "document:subscribe"
}
```

### GET /api/web-adobe/analyze/[documentId]

Check current analysis status.

**Response:** 200 OK
```json
{
  "documentId": "clxy123...",
  "status": "REVIEW",
  "filename": "form.pdf",
  "pageCount": 3,
  "fieldCount": 15,
  "fileReady": true,
  "canAnalyze": true,
  "lastUpdated": "2025-10-07T12:34:56Z"
}
```

## Socket.IO Events

### Server → Client Events

#### analysis:start
```typescript
{
  documentId: string
  fileName: string
  totalPages: number
  startedAt: number
  userId: string
}
```

#### analysis:progress
```typescript
{
  documentId: string
  progress: number // 0-100
  currentPage: number
  totalPages: number
  stage: 'preprocessing' | 'ocr' | 'field-extraction' | 'validation'
  message?: string
}
```

#### analysis:complete
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

#### analysis:error
```typescript
{
  documentId: string
  error: string
  stage: string
  recoverable: boolean
  timestamp: number
}
```

## Field Types

```typescript
type FieldType = 'text' | 'checkbox' | 'dropdown' | 'signature' | 'number' | 'date'
```

### Detection Logic

| Type | Detection Method |
|------|------------------|
| **text** | Default fallback, keywords: "name", "address", "city", "email" |
| **number** | Keywords: "age", "quantity", "amount", "total", "count" |
| **date** | Keywords: "date", "dob", "birth", "expires", "year" |
| **checkbox** | Small square fields, keywords: "agree", "accept", "confirm" |
| **signature** | Large rectangular areas, keywords: "signature", "sign", "initial" |
| **dropdown** | Native form field type detection |

## Bounding Box Format

Coordinates are normalized to 0-1 range:

```typescript
interface BoundingBox {
  x: number      // 0-1 (left edge)
  y: number      // 0-1 (top edge, flipped Y-axis)
  width: number  // 0-1 (relative to page width)
  height: number // 0-1 (relative to page height)
}
```

**Example:**
```typescript
{
  x: 0.25,      // 25% from left
  y: 0.10,      // 10% from top
  width: 0.30,  // 30% of page width
  height: 0.05  // 5% of page height
}
```

## Database Schema

### PdfDocument
```prisma
model PdfDocument {
  id          String            @id @default(cuid())
  userId      String
  title       String
  filename    String
  storagePath String
  status      PdfDocumentStatus @default(DRAFT)
  pageCount   Int?
  fileSize    Int?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  fields      PdfField[]
}

enum PdfDocumentStatus {
  DRAFT      // Initial upload
  ANALYZING  // Background analysis in progress
  REVIEW     // Fields extracted, ready for review
  SYNCED     // Synced to DataPad
  ERROR      // Analysis or sync failed
}
```

### PdfField
```prisma
model PdfField {
  id              String         @id @default(cuid())
  documentId      String
  pdfName         String         // Field name (snake_case)
  displayLabel    String?        // Human-readable label
  fieldType       String         @default("text")
  x               Float          // Normalized 0-1
  y               Float          // Normalized 0-1
  width           Float          // Normalized 0-1
  height          Float          // Normalized 0-1
  pageNumber      Int            @default(1)
  status          PdfFieldStatus @default(DRAFT)
  suggestions     Json?          // { confidence: 0.95, extractedValue: "..." }
  datapadFieldId  String?        // Link to DataPad field
  updatedAt       DateTime       @updatedAt
}
```

## Error Handling

### Common Errors

| Error | HTTP Status | Recovery |
|-------|-------------|----------|
| Invalid PDF | 400 | Re-upload valid PDF |
| File not found | 404 | Check document ID |
| Already analyzing | 409 | Wait for completion |
| Analysis timeout | 500 | Re-trigger analysis |
| Extraction failed | 500 | Check PDF format |

### Error Event
```typescript
socket.on('analysis:error', (data) => {
  if (data.recoverable) {
    // Retry analysis
    fetch(`/api/web-adobe/analyze/${data.documentId}`, { method: 'POST' })
  } else {
    // Show error to user
    showError(data.error)
  }
})
```

## Performance

### Benchmarks
- **Small PDF** (1-5 pages): 2-5 seconds
- **Medium PDF** (5-20 pages): 5-15 seconds
- **Large PDF** (20-50 pages): 15-60 seconds

### Optimization
- Chunked processing (page by page)
- Progress updates every 10%
- Timeout: 60 seconds for large PDFs
- Batch database inserts (100 fields per batch)

## Testing

```bash
# Run unit tests
npm test lib/web-adobe/__tests__

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Files
- `pdf-field-extractor.test.ts` - Core extraction logic
- `field-analysis-worker.test.ts` - Background worker (TODO)
- `api-routes.test.ts` - API endpoints (TODO)

## Dependencies

```json
{
  "pdf-lib": "^1.17.1",        // Form field extraction
  "pdfjs-dist": "^5.4.296",    // Text analysis
  "socket.io": "^4.8.0",       // Real-time events
  "@prisma/client": "^6.16.2"  // Database
}
```

## Future Enhancements

- [ ] OCR for scanned PDFs (Tesseract.js)
- [ ] Machine learning for field classification
- [ ] Multi-language support
- [ ] Advanced validation rules
- [ ] Batch upload (multiple PDFs)
- [ ] Field grouping and sections
- [ ] Export to JSON/CSV
- [ ] DataPad sync integration

## Troubleshooting

### Analysis stuck at 0%
- Check server logs: `docker logs glxy-gaming-web-1`
- Verify PDF file exists: Check `uploads/pdfs/` directory
- Re-trigger analysis: `POST /api/web-adobe/analyze/[documentId]`

### No fields extracted
- PDF might be scanned (image-based) → OCR needed
- PDF might be protected → Check encryption
- Try manual field annotation in PDF editor first

### Socket.IO not connecting
- Verify namespace: `/web-adobe`
- Check authentication: Must be logged in
- Enable CORS in development: `socket.io({ cors: { origin: "*" } })`

## Support

For issues or questions:
- Check logs: `docker logs glxy-gaming-web-1`
- Review Socket.IO events in browser DevTools
- Verify database entries: `npx prisma studio`

## License

MIT
