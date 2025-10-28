# Adobe PDF Services - Setup & Integration Guide

## Übersicht

Das GLXY Gaming Projekt nutzt Adobe PDF Services für:
- **PDF Upload & Processing**: Analyse, Text-Extraktion, Formular-Felder
- **PDF Generation**: Dynamische PDF-Erstellung aus Formular-Daten
- **OCR**: Text-Erkennung in gescannten PDFs
- **Kompression**: PDF-Dateigrößen-Optimierung

## Aktueller Status

**MOCK-Modus aktiv** - Alle PDF-Services laufen mit simulierten Daten.

Für Production-Deployment mit echten Adobe API-Calls siehe [Production Setup](#production-setup).

---

## API Endpoints

### 1. `/api/process-pdf` - PDF Verarbeitung

**Upload und Analyse von PDF-Dateien**

**Method:** `POST`
**Content-Type:** `multipart/form-data`
**Auth:** Optional (konfigurierbar)

**Request Parameters:**
```javascript
{
  file: File,                    // PDF-Datei (max 10MB)
  extractText: boolean,          // Text extrahieren (default: false)
  extractFormFields: boolean,    // Formular-Felder erkennen (default: false)
  analyzeStructure: boolean,     // Struktur analysieren (default: true)
  performOcr: boolean,          // OCR durchführen (default: false)
  compressOutput: boolean       // Output komprimieren (default: false)
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    fileId: string
    fileName: string
    fileSize: number
    pageCount: number
    extractedText?: string
    formFields?: ExtractedFormField[]
    metadata?: PdfMetadata
    processingTime: number
    downloadUrl: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

**Beispiel (cURL):**
```bash
curl -X POST http://localhost:3000/api/process-pdf \
  -F "file=@document.pdf" \
  -F "extractText=true" \
  -F "extractFormFields=true"
```

**Beispiel (JavaScript):**
```javascript
const formData = new FormData()
formData.append('file', pdfFile)
formData.append('extractText', 'true')
formData.append('extractFormFields', 'true')

const response = await fetch('/api/process-pdf', {
  method: 'POST',
  body: formData
})

const result = await response.json()
if (result.success) {
  console.log('Extracted text:', result.data.extractedText)
  console.log('Download URL:', result.data.downloadUrl)
}
```

---

### 2. `/api/generate-pdf` - PDF Generierung

**PDF aus Formular-Daten erstellen**

**Method:** `POST`
**Content-Type:** `application/json`
**Auth:** Optional (konfigurierbar)

**Request Body:**
```typescript
{
  fields: FormField[]           // Formular-Felder
  template: string              // Template-Identifier
  settings: {
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | 'Tabloid'
    orientation: 'Portrait' | 'Landscape'
    fillable: boolean           // Ausfüllbare Felder
    encrypted: boolean          // Passwort-Schutz
    password?: string          // Passwort (min 8 Zeichen)
    permissions?: {
      printing: boolean
      modifying: boolean
      copying: boolean
      annotating: boolean
    }
    metadata?: {
      title: string
      author: string
      subject: string
      keywords: string[]
      creator: string
    }
  }
}
```

**Response:**
```typescript
{
  success: boolean
  fileId: string
  fileName: string
  fileSize: number
  downloadUrl: string
  expiresAt: Date
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

**Beispiel (JavaScript):**
```javascript
const response = await fetch('/api/generate-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: [
      {
        id: '1',
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        value: 'John',
        required: true
      },
      {
        id: '2',
        name: 'email',
        type: 'email',
        label: 'Email',
        value: 'john@example.com'
      }
    ],
    template: 'contact-form',
    settings: {
      pageSize: 'A4',
      orientation: 'Portrait',
      fillable: false,
      encrypted: false,
      metadata: {
        title: 'Contact Form',
        author: 'GLXY Gaming'
      }
    }
  })
})

const result = await response.json()
if (result.success) {
  // Download PDF
  window.location.href = result.downloadUrl
}
```

---

## Mock-Modus (Development)

Im Mock-Modus werden alle Adobe API-Calls simuliert:

**Features:**
- Minimale aber valide PDF-Generierung
- Simulierte Text-Extraktion
- Dummy Form-Fields
- Keine echten Adobe API-Kosten
- Sofortige Response (keine Wartezeit)

**Aktivierung:**
Mock-Modus ist automatisch aktiv wenn:
- `ADOBE_CLIENT_ID` nicht gesetzt ist
- `ADOBE_CLIENT_ID=MOCK_CLIENT_ID`

**Limitations:**
- Keine echte Text-Extraktion
- Keine echte OCR
- Keine echte Kompression
- Generierte PDFs sind minimal-valide Dummy-Dateien

---

## Production Setup

### 1. Adobe Account & Credentials

1. **Account erstellen:**
   - Gehe zu https://developer.adobe.com/
   - Erstelle kostenlosen Account
   - Navigiere zu "Document Services"

2. **Credentials erstellen:**
   - Klicke "Create credentials"
   - Wähle "PDF Services API"
   - Notiere: Client ID, Client Secret, Organization ID

### 2. SDK Installation

```bash
npm install @adobe/pdfservices-node-sdk
```

### 3. Environment Variables

Füge folgende Variablen zu `.env.local` hinzu:

```bash
# Adobe PDF Services
ADOBE_CLIENT_ID=your_actual_client_id_here
ADOBE_CLIENT_SECRET=your_actual_client_secret_here
ADOBE_ORG_ID=your_actual_org_id_here
ADOBE_PDF_SERVICES_ENABLED=true
ADOBE_PDF_SERVICES_REGION=US
ADOBE_PDF_SERVICES_TIMEOUT=30000

# Limits
PDF_MAX_FILE_SIZE=10485760
PDF_MAX_PAGES=100
PDF_PROCESSING_TIMEOUT=60000
PDF_DOWNLOAD_EXPIRY_HOURS=24
```

### 4. Code-Anpassung in `lib/adobe-pdf-services.ts`

Ersetze die Mock-Implementations mit echten Adobe API-Calls:

```typescript
// TODO-Blöcke im Code zeigen wo Änderungen nötig sind
// Beispiel: extractTextFromPdf(), generatePdfFromData(), etc.

// Vor (Mock):
if (this.credentials?.clientId === 'MOCK_CLIENT_ID') {
  return this.mockExtractText(buffer)
}

// Nach (Production):
const extractPdfOperation = PDFServicesSdk.ExtractPDF.Operation.createNew()
const input = PDFServicesSdk.FileRef.createFromStream(
  buffer,
  PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
)
extractPdfOperation.setInput(input)
const result = await extractPdfOperation.execute(executionContext)
return result.text
```

### 5. Testing

```bash
# Test PDF Processing
curl -X POST http://localhost:3000/api/process-pdf \
  -F "file=@test.pdf" \
  -F "extractText=true"

# Test PDF Generation
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

---

## Sicherheit

### File Upload Validation
- **Max Size:** 10MB (konfigurierbar)
- **MIME-Type:** `application/pdf` only
- **Content Validation:** PDF Magic Bytes Check (%PDF)
- **Buffer Validation:** Vollständige Buffer-Prüfung

### Download Security
- **Unique File IDs:** UUID v4
- **No Path Traversal:** Filename Sanitization
- **Access Control:** Optional Auth-Check
- **Expiry:** Automatische Löschung nach 24h

### Error Handling
- **Custom Error Types:** `PdfServiceError` mit Error Codes
- **Graceful Degradation:** Bei Fehlern weiter verarbeiten
- **Comprehensive Logging:** Alle Fehler werden geloggt
- **User-Friendly Messages:** Klare Fehlermeldungen

---

## Type Definitions

Alle Types sind in `/types/pdf-services.ts` definiert:

```typescript
import type {
  FormField,
  PdfSettings,
  ProcessedPdfResult,
  GeneratePdfRequest,
  PdfServiceError,
  PdfServiceErrorCode
} from '@/types/pdf-services'
```

**Haupt-Types:**
- `FormField` - Formular-Feld-Definition
- `PdfSettings` - PDF-Generierungs-Einstellungen
- `ProcessedPdfResult` - Verarbeitungs-Ergebnis
- `ExtractedFormField` - Extrahierte Formular-Felder
- `PdfMetadata` - PDF-Metadaten
- `PdfAnalysisResult` - Analyse-Ergebnis

---

## Troubleshooting

### "Adobe PDF Services not configured"
- Prüfe `ADOBE_CLIENT_ID` in `.env.local`
- Stelle sicher SDK ist installiert
- Prüfe Credentials auf Adobe Developer Console

### "File is not a valid PDF"
- Prüfe MIME-Type der hochgeladenen Datei
- Stelle sicher Datei beginnt mit %PDF
- Prüfe ob Datei korrupt ist

### "Password required for encrypted PDFs"
- Bei `settings.encrypted=true` muss `password` gesetzt sein
- Passwort muss mindestens 8 Zeichen lang sein

### "File too large"
- Default Limit: 10MB
- Änderbar via `PDF_MAX_FILE_SIZE` Environment Variable

---

## Entwickler-Notizen

### Library Structure
```
lib/adobe-pdf-services.ts
├── AdobePdfServicesClient (Singleton)
├── initializePdfServices()
├── extractTextFromPdf()
├── extractFormFields()
├── analyzePdf()
├── generatePdfFromData()
├── performOcr()
├── compressPdf()
└── validatePdfBuffer()
```

### API Routes Structure
```
app/api/
├── process-pdf/
│   ├── route.ts (POST: Upload & Process)
│   └── download/[fileId]/route.ts (GET: Download)
└── generate-pdf/
    ├── route.ts (POST: Generate)
    └── download/[fileId]/route.ts (GET: Download)
```

### Storage Directories
```
uploads/pdfs/
├── processed/    # Verarbeitete PDFs
├── generated/    # Generierte PDFs
└── temp/         # Temporäre Upload-Dateien
```

---

## Support & Resources

**Adobe Dokumentation:**
- https://developer.adobe.com/document-services/docs/overview/
- https://developer.adobe.com/document-services/docs/apis/#tag/PDF-Services

**GLXY Gaming Projekt:**
- Haupt-README: `/README.md`
- API-Tests: `/e2e/tests/web-adobe/`
- Type Definitions: `/types/pdf-services.ts`

**Kontakt:**
- GitHub Issues für Bug Reports
- Pull Requests für Contributions

---

**Version:** 1.0.0
**Erstellt:** 2025-10-07
**Status:** Mock-Modus (Development Ready)
