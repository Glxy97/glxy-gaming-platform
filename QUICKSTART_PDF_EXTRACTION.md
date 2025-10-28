# Quick Start: PDF Field Extraction

Schnelleinstieg für die Nutzung des PDF Field Extraction Service.

## 1. Upload PDF

### Frontend (React/Next.js)

```typescript
'use client'

import { useState } from 'react'
import { io } from 'socket.io-client'

export function PdfUploader() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')

  const handleUpload = async (file: File) => {
    // Upload PDF
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/web-adobe/upload', {
      method: 'POST',
      body: formData,
    })

    const { document } = await response.json()
    console.log('Document ID:', document.id)

    // Connect to Socket.IO
    const socket = io('/web-adobe')

    socket.emit('document:subscribe', { documentId: document.id })

    // Listen to progress
    socket.on('analysis:start', (data) => {
      setStatus(`Analyzing ${data.fileName}...`)
      setProgress(0)
    })

    socket.on('analysis:progress', (data) => {
      setProgress(data.progress)
      setStatus(data.message || `Processing page ${data.currentPage}/${data.totalPages}`)
    })

    socket.on('analysis:complete', (data) => {
      setProgress(100)
      setStatus(`Complete! Found ${data.totalFields} fields`)
    })

    socket.on('analysis:error', (data) => {
      setStatus(`Error: ${data.error}`)
    })
  }

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      />
      <div>{status}</div>
      <progress value={progress} max={100} />
    </div>
  )
}
```

## 2. Fetch Extracted Fields

```typescript
// Get document with fields
const response = await fetch(`/api/web-adobe/documents/${documentId}`)
const { document, fields } = await response.json()

// Display fields
fields.forEach(field => {
  console.log(`${field.displayLabel}: ${field.fieldType}`)
  console.log(`  Page ${field.pageNumber}, Position: (${field.x}, ${field.y})`)
})
```

## 3. Manual Trigger Analysis

```typescript
// Re-analyze or trigger analysis manually
const response = await fetch(`/api/web-adobe/analyze/${documentId}`, {
  method: 'POST'
})

if (response.status === 202) {
  console.log('Analysis started. Connect to Socket.IO for updates.')
}
```

## 4. Backend Usage

### Direct API Call

```typescript
import { analyzeDocument } from '@/lib/web-adobe'

// Trigger analysis from server-side
await analyzeDocument(documentId)
```

### Custom Progress Callback

```typescript
import { extractFieldsFromPdf } from '@/lib/web-adobe'

const result = await extractFieldsFromPdf(
  '/path/to/file.pdf',
  (progress, stage) => {
    console.log(`${progress}% - ${stage}`)
  }
)

console.log(`Found ${result.fields.length} fields`)
```

### Batch Processing

```typescript
import { analyzeDocumentBatch } from '@/lib/web-adobe'

const results = await analyzeDocumentBatch([
  'doc-id-1',
  'doc-id-2',
  'doc-id-3'
])

results.forEach(result => {
  console.log(`${result.documentId}: ${result.success ? 'Success' : result.error}`)
})
```

## 5. Field Validation

```typescript
import { validateFieldValue, sanitizeFieldValue } from '@/lib/web-adobe'

// Validate field value
const result = validateFieldValue(field, 'john@example.com')

if (!result.valid) {
  console.error('Validation errors:', result.errors)
}

// Sanitize value
const sanitized = sanitizeFieldValue('  John Doe  ', 'text')
console.log(sanitized) // "John Doe"
```

## 6. Test Extraction

```bash
# Test on sample PDF
tsx scripts/test-pdf-extraction.ts path/to/sample.pdf

# Export results to JSON
tsx scripts/test-pdf-extraction.ts path/to/sample.pdf --export
```

## 7. Socket.IO Events

### Subscribe to Document

```typescript
socket.emit('document:subscribe', { documentId: 'doc-123' })
```

### Unsubscribe

```typescript
socket.emit('document:unsubscribe', { documentId: 'doc-123' })
```

### Listen to All Events

```typescript
socket.on('analysis:start', (data) => console.log('Started:', data))
socket.on('analysis:progress', (data) => console.log('Progress:', data.progress))
socket.on('analysis:complete', (data) => console.log('Complete:', data.totalFields))
socket.on('analysis:error', (data) => console.error('Error:', data.error))
```

## 8. Database Queries

```typescript
import { prisma } from '@/lib/db'

// Get document with fields
const document = await prisma.pdfDocument.findUnique({
  where: { id: documentId },
  include: {
    fields: {
      orderBy: { pageNumber: 'asc' }
    }
  }
})

// Get fields by page
const pageFields = await prisma.pdfField.findMany({
  where: {
    documentId,
    pageNumber: 1
  }
})

// Get fields by type
const checkboxes = await prisma.pdfField.findMany({
  where: {
    documentId,
    fieldType: 'checkbox'
  }
})
```

## 9. Error Handling

```typescript
socket.on('analysis:error', async (data) => {
  console.error('Analysis failed:', data.error)

  if (data.recoverable) {
    // Retry after 5 seconds
    setTimeout(async () => {
      await fetch(`/api/web-adobe/analyze/${data.documentId}`, {
        method: 'POST'
      })
    }, 5000)
  }
})
```

## 10. Complete Example

```typescript
import { io } from 'socket.io-client'

async function processPdf(file: File) {
  // 1. Upload
  const formData = new FormData()
  formData.append('file', file)

  const uploadResponse = await fetch('/api/web-adobe/upload', {
    method: 'POST',
    body: formData,
  })

  const { document } = await uploadResponse.json()

  // 2. Connect Socket.IO
  const socket = io('/web-adobe')

  return new Promise((resolve, reject) => {
    socket.emit('document:subscribe', { documentId: document.id })

    socket.on('analysis:complete', async (data) => {
      // 3. Fetch fields
      const fieldsResponse = await fetch(`/api/web-adobe/documents/${document.id}`)
      const { fields } = await fieldsResponse.json()

      socket.disconnect()
      resolve({ document, fields, data })
    })

    socket.on('analysis:error', (data) => {
      socket.disconnect()
      reject(new Error(data.error))
    })
  })
}

// Usage
try {
  const result = await processPdf(pdfFile)
  console.log('Success:', result.fields.length, 'fields extracted')
} catch (error) {
  console.error('Failed:', error.message)
}
```

---

## API Reference

### POST /api/web-adobe/upload
- Upload PDF file
- Auto-triggers analysis
- Returns document object

### POST /api/web-adobe/analyze/[documentId]
- Manually trigger analysis
- Returns 202 Accepted (background job)

### GET /api/web-adobe/analyze/[documentId]
- Check analysis status
- Returns field count and status

---

## Environment Variables

```env
# Optional: Adjust timeouts
ANALYSIS_TIMEOUT=60000  # 60 seconds

# Optional: Batch size
FIELD_BATCH_SIZE=100
```

---

## Troubleshooting

### Issue: No fields extracted
**Solution:** PDF might be scanned. Try OCR or manual annotation.

### Issue: Socket.IO not connecting
**Solution:** Check namespace `/web-adobe` and authentication.

### Issue: Analysis stuck
**Solution:** Re-trigger with POST /api/web-adobe/analyze/[documentId]

---

## Next Steps

1. ✅ Upload sample PDF
2. ✅ Monitor Socket.IO events
3. ✅ Review extracted fields
4. ✅ Implement field editing UI
5. ✅ Sync to DataPad (future)

**For full documentation:** See `lib/web-adobe/README.md`
