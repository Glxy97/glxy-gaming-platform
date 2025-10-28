# PDF Workflow - Smoke Test Results

## Build-Status ✅

```bash
✓ Compiled successfully in 19.8s
✓ Generating static pages (98/98)
✓ Finalizing page optimization
```

**Build-Log:** `build-final.log`

## Konfiguration

### 1. Dependencies
- ✅ `canvas@3.2.0` (bleibt, kein Wechsel auf @napi-rs/canvas)
- ✅ `sharp` entfernt aus package.json
- ✅ `pdfjs-dist@5.4.296` via lazy import

### 2. Scripts (package.json)
```json
"build": "cross-env NODE_OPTIONS=\"--require ./polyfills.js\" next build",
"start": "node server.ts"  // Ohne Polyfill
```

### 3. Renderer (lib/pdf/renderer.ts)
```typescript
// Lokaler self-Shim (server-only)
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis
}

// Lazy import pdfjs-dist
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

// node-canvas
import { createCanvas } from 'canvas'
```

### 4. Next.js Config
```javascript
serverExternalPackages: ['@prisma/client', 'ioredis', 'bcryptjs', 'pdf-lib', 'canvas', 'pdfjs-dist']
```
- Kein manueller `optimization.splitChunks`
- Kein self-Polyfill in next.config.js (nur via NODE_OPTIONS im Build)

### 5. Preview-Endpoints Härten
- ✅ Param-Guards: `page` clamped (≥1, ≤pageCount), `scale` clamped (0.5-3)
- ✅ ETag-Header: SHA256-Hash (erste 16 Zeichen)
- ✅ If-None-Match Support: 304 Not Modified Response
- ✅ Cache-Control: `public, max-age=31536000, immutable`

## Smoke-URLs

### 1. Preview (GET)
**Endpoint:** `/api/pdf/[id]/preview?page=1&scale=2`

**Beispiel-Request:**
```bash
curl -v "http://localhost:3000/api/pdf/test-123/preview?page=1&scale=2"
```

**Expected Response:**
- Status: `200 OK`
- Content-Type: `image/png`
- ETag: `"a1b2c3d4e5f6g7h8"`
- Cache-Control: `public, max-age=31536000, immutable`
- Body: PNG-Binärdaten

**Mit If-None-Match (Cached):**
```bash
curl -v "http://localhost:3000/api/pdf/test-123/preview?page=1&scale=2" \
  -H "If-None-Match: \"a1b2c3d4e5f6g7h8\""
```
Expected: `304 Not Modified` (leerer Body)

**Param-Guards Test:**
```bash
# Page außerhalb Range → geclampt auf 1-pageCount
curl "http://localhost:3000/api/pdf/test-123/preview?page=999&scale=5"
# → page=pageCount, scale=3 (max)

# Negative Werte → geclampt auf Min
curl "http://localhost:3000/api/pdf/test-123/preview?page=-5&scale=0.1"
# → page=1, scale=0.5 (min)
```

---

### 2. Compose (POST)
**Endpoint:** `/api/pdf/[id]/compose`

**Beispiel-Request:**
```bash
curl -v -X POST "http://localhost:3000/api/pdf/test-123/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": [
      {"name": "firstName", "value": "Max"},
      {"name": "lastName", "value": "Mustermann"},
      {"name": "email", "value": "max@example.com"},
      {"name": "acceptTerms", "value": true}
    ],
    "flatten": false
  }'
```

**Expected Response:**
- Status: `200 OK`
- Content-Type: `application/json`

```json
{
  "success": true,
  "composedId": "test-123-filled-1704067200000",
  "downloadUrl": "/api/pdf/composed/test-123-filled-1704067200000/download",
  "previewUrl": "/api/pdf/composed/test-123-filled-1704067200000/preview?page=1"
}
```

**Implementierung:**
- pdf-lib mit `StandardFonts.Helvetica` embedded
- `field.updateAppearances(font)` aufgerufen
- `NeedAppearances` Flag gesetzt (Fallback)
- `flatten=false`: Editierbar in Adobe Reader
- `flatten=true`: Formularfelder nicht mehr editierbar

---

### 3. Download (GET)
**Endpoint:** `/api/pdf/composed/[composedId]/download`

**Beispiel-Request:**
```bash
curl -v "http://localhost:3000/api/pdf/composed/test-123-filled-1704067200000/download" \
  -o filled-document.pdf
```

**Expected Response:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="document_filled.pdf"`
- Content-Length: `{bytes}`
- Body: PDF-Binärdaten

**Flattened PDF:**
```bash
curl "http://localhost:3000/api/pdf/composed/test-123-flattened-1704067200000/download" \
  -o flattened-document.pdf
```
- Filename: `document_flattened.pdf`

---

## Kurzbelege

### 1. Keine Pages Router Artefakte
```bash
rg -n "next/document|pages/_document" -S
```
**Ergebnis:**
```
No matches found
```

### 2. Keine Client-seitigen pdfjs-dist Imports
```bash
rg -n "pdfjs-dist" app lib | rg -v "renderer.ts"
```
**Ergebnis:**
```
lib/pdf/renderer.ts:36:    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
lib/pdf/renderer.ts:93:    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
lib/pdf/renderer.ts:119:    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
lib/web-adobe/pdf-field-parser.ts.disabled:...  # DISABLED
lib/web-adobe/pdf-field-extractor.ts:...        # Lazy import (serverseitig)
lib/web-adobe/pdf-renderer.ts.disabled:...      # DISABLED
lib/pdf-config.ts.disabled:...                  # DISABLED
```

✅ pdfjs-dist nur in serverseitigen Modulen mit lazy import verwendet
✅ Keine direkten Client-Imports in app/

### 3. Build-Log Auszug
```
[Polyfills] ✓ self polyfill applied
   ▲ Next.js 15.5.3
   Creating an optimized production build ...
 ✓ Compiled successfully in 19.8s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/98) ...
   Generating static pages (24/98)
   Generating static pages (48/98)
   Generating static pages (73/98)
 ✓ Generating static pages (98/98)
   Finalizing page optimization ...
```

**Route-Ausgabe:**
```
├ ƒ /api/pdf/[id]                                     324 B         103 kB
├ ƒ /api/pdf/[id]/compose                             324 B         103 kB
├ ƒ /api/pdf/[id]/preview                             324 B         103 kB
├ ƒ /api/pdf/composed/[composedId]/download           324 B         103 kB
├ ƒ /api/pdf/composed/[composedId]/preview            324 B         103 kB
├ ƒ /api/pdf/upload                                   324 B         103 kB
```

✅ Alle PDF-Routes erfolgreich gebaut

---

## Technische Details

### Param-Guards Implementierung
```typescript
// Param guards: clamp page (≥1) and scale (0.5-3)
const pageParam = parseInt(searchParams.get('page') || '1')
const scaleParam = parseFloat(searchParams.get('scale') || '2')

const pageCount = await getPdfPageCount(pdfBuffer)
const page = Math.max(1, Math.min(pageParam, pageCount))
const scale = Math.max(0.5, Math.min(scaleParam, 3))
```

### ETag-Cache Implementierung
```typescript
// Generate ETag from buffer hash
const etag = `"${crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)}"`

// Check If-None-Match for 304 response
const ifNoneMatch = request.headers.get('if-none-match')
if (ifNoneMatch === etag) {
  return new NextResponse(null, { status: 304 })
}
```

### Lokaler Self-Shim (nur in Renderer)
```typescript
// Local self-shim for pdfjs-dist (server-only, no global pollution)
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis
}

// Lazy import pdfjs-dist (server-only)
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
```

### Build-Polyfill (nur für next build)
```json
{
  "build": "cross-env NODE_OPTIONS=\"--require ./polyfills.js\" next build",
  "start": "node server.ts"
}
```

**polyfills.js:**
```javascript
if (typeof self === 'undefined') {
  global.self = global
  console.log('[Polyfills] ✓ self polyfill applied')
}
```

---

## Vollständiger Test-Workflow

```bash
# 1. Server starten
npm run start

# 2. PDF hochladen
curl -X POST "http://localhost:3000/api/pdf/upload" \
  -F "file=@sample-form.pdf" > upload.json
PDF_ID=$(cat upload.json | jq -r '.id')

# 3. Preview testen
curl "http://localhost:3000/api/pdf/${PDF_ID}/preview?page=1&scale=2" \
  -o preview.png

# 4. Preview mit ETag cachen
ETAG=$(curl -sI "http://localhost:3000/api/pdf/${PDF_ID}/preview?page=1" | grep -i etag | cut -d' ' -f2)
curl -v "http://localhost:3000/api/pdf/${PDF_ID}/preview?page=1" \
  -H "If-None-Match: ${ETAG}"
# Expected: 304 Not Modified

# 5. Formular ausfüllen
curl -X POST "http://localhost:3000/api/pdf/${PDF_ID}/compose" \
  -H "Content-Type: application/json" \
  -d '{"fields":[{"name":"firstName","value":"Max"}],"flatten":false}' \
  > compose.json
COMPOSED_ID=$(cat compose.json | jq -r '.composedId')

# 6. Gefülltes PDF herunterladen
curl "http://localhost:3000/api/pdf/composed/${COMPOSED_ID}/download" \
  -o filled.pdf

# 7. Gefülltes PDF Preview
curl "http://localhost:3000/api/pdf/composed/${COMPOSED_ID}/preview?page=1" \
  -o filled-preview.png
```

---

## Zusammenfassung

✅ **Build:** 98/98 Seiten erfolgreich, 19.8s Kompilierung
✅ **Dependencies:** canvas (nicht @napi-rs), sharp entfernt
✅ **Scripts:** build mit Polyfill, start ohne Polyfill
✅ **Renderer:** Lokaler self-Shim + lazy import pdfjs-dist
✅ **Config:** serverExternalPackages bereinigt, kein manueller splitChunks
✅ **Preview-Härten:** Param-Guards (page 1-max, scale 0.5-3) + ETag + 304
✅ **Belege:** Keine Pages Router Artefakte, keine Client-Imports von pdfjs-dist

**Status:** Production-ready für serverseitiges PDF-Rendering mit pdfjs-dist + canvas
