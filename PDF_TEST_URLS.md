# PDF Workflow Test-URLs

## Build-Status
✅ Build erfolgreich mit:
- Lokaler self-Shim in lib/pdf/renderer.ts
- Lazy import von pdfjs-dist
- NODE_OPTIONS Polyfill für Build-Phase
- 98/98 Seiten erfolgreich generiert

## 1. Preview URL (GET)
**Endpoint:** `/api/pdf/[id]/preview`

**Beispiel:**
```bash
curl "http://localhost:3000/api/pdf/test-pdf-id/preview?page=1&scale=2"
```

**Parameter:**
- `id` (required): PDF-Dokument-ID aus Upload
- `page` (optional, default: 1): Seitennummer (1-indiziert)
- `scale` (optional, default: 2): Skalierungsfaktor für PNG-Auflösung

**Response:**
- Content-Type: `image/png`
- Body: PNG-Bild der gerenderten PDF-Seite
- Cache: `public, max-age=31536000`

**Implementierung:**
- Server-seitiges Rendering mit pdfjs-dist + node-canvas
- Lazy import des Renderers zur Laufzeit
- Lokaler self-Shim im Renderer-Modul

## 2. Compose URL (POST)
**Endpoint:** `/api/pdf/[id]/compose`

**Beispiel:**
```bash
curl -X POST "http://localhost:3000/api/pdf/test-pdf-id/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": [
      {"name": "firstName", "value": "Max"},
      {"name": "lastName", "value": "Mustermann"},
      {"name": "email", "value": "max@example.com"}
    ],
    "flatten": false
  }'
```

**Request Body:**
```typescript
{
  fields: Array<{ name: string; value: string | boolean }>,
  flatten?: boolean  // Default: false (editable), true = flattened
}
```

**Response:**
```json
{
  "success": true,
  "composedId": "abc123-filled-1234567890",
  "downloadUrl": "/api/pdf/composed/abc123-filled-1234567890/download",
  "previewUrl": "/api/pdf/composed/abc123-filled-1234567890/preview?page=1"
}
```

**Implementierung:**
- pdf-lib für Form-Field-Manipulation
- Helvetica-Font eingebettet
- updateAppearances() für korrekte Darstellung
- NeedAppearances-Flag als Fallback

## 3. Download URL (GET)
**Endpoint:** `/api/pdf/composed/[composedId]/download`

**Beispiel:**
```bash
curl "http://localhost:3000/api/pdf/composed/abc123-filled-1234567890/download" \
  -o output.pdf
```

**Parameter:**
- `composedId` (required): ID des komponierten PDFs aus Compose-Response

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="document_filled.pdf"` (oder `document_flattened.pdf`)
- Body: Binäre PDF-Daten

## Vollständiger Workflow-Test

### 1. PDF hochladen
```bash
curl -X POST "http://localhost:3000/api/pdf/upload" \
  -F "file=@sample-form.pdf" \
  > upload-response.json

# Extrahiere ID
PDF_ID=$(jq -r '.id' upload-response.json)
```

### 2. Preview generieren
```bash
curl "http://localhost:3000/api/pdf/${PDF_ID}/preview?page=1&scale=2" \
  -o preview-page1.png
```

### 3. Felder ausfüllen
```bash
curl -X POST "http://localhost:3000/api/pdf/${PDF_ID}/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": [
      {"name": "name", "value": "Max Mustermann"},
      {"name": "acceptTerms", "value": true}
    ],
    "flatten": false
  }' > compose-response.json

# Extrahiere composed ID
COMPOSED_ID=$(jq -r '.composedId' compose-response.json)
```

### 4. Gefülltes PDF herunterladen
```bash
curl "http://localhost:3000/api/pdf/composed/${COMPOSED_ID}/download" \
  -o filled-document.pdf
```

### 5. Gefülltes PDF-Preview
```bash
curl "http://localhost:3000/api/pdf/composed/${COMPOSED_ID}/preview?page=1" \
  -o filled-preview.png
```

## Technische Details

### Lokaler Self-Shim (lib/pdf/renderer.ts)
```typescript
// Lazy import pdfjs-dist (server-only)
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis
}
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
```

### Build-Polyfill (package.json)
```json
{
  "build": "cross-env NODE_OPTIONS=\"--require ./polyfills.js\" next build"
}
```

### Webpack-Konfiguration
- serverExternalPackages: `['canvas', 'pdfjs-dist', 'pdf-lib', ...]`
- Lazy imports in Route-Handlern
- force-dynamic für Preview-Routes

## Browser-Test URLs

Wenn Server läuft (`npm run dev` oder `npm start`):

1. **Preview:** http://localhost:3000/api/pdf/test-id/preview?page=1
2. **Compose:** POST zu http://localhost:3000/api/pdf/test-id/compose
3. **Download:** http://localhost:3000/api/pdf/composed/test-composed-id/download

## Hinweise

- Upload-ID muss existieren (via `/api/pdf/upload`)
- Preview-Seite muss im Bereich 1-{pageCount} liegen
- Composed-ID wird von Compose-API generiert
- Scale-Wert beeinflusst PNG-Auflösung (höher = größer/detaillierter)
- Flatten=true: Felder nicht mehr editierbar
- Flatten=false: PDF bleibt editierbar in Adobe Reader
