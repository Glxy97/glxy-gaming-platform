# PDF Services - Quick Start Guide

## Übersicht

Vollständige PDF-Processing-Backend-Infrastruktur für das GLXY Gaming Projekt.

**Status:** Mock-Modus (Development Ready) - Produktionsreif mit Adobe SDK-Integration

## Implementierte Features

### 1. API Routes

#### `/api/process-pdf` - PDF Upload & Verarbeitung
- Multipart File Upload
- PDF-Validierung (Typ, Größe, Content)
- Text-Extraktion
- Formular-Feld-Erkennung
- OCR-Support
- Kompression

#### `/api/generate-pdf` - PDF Generierung
- JSON-basierte Formular-Daten
- Anpassbare Seitenformate (A4, Letter, Legal, etc.)
- Fillable Forms
- Passwort-Schutz & Verschlüsselung
- Metadaten-Konfiguration

### 2. Library & Helper

**`/lib/adobe-pdf-services.ts`**
- Singleton PDF Services Client
- Mock-Implementierung für Development
- Produktionsfertig für Adobe SDK
- Umfassende Error-Handling

**`/lib/validations/pdf-validation.ts`**
- Zod-basierte Validierung
- Type-Safe Request Validation
- File Upload Security

### 3. Type Definitions

**`/types/pdf-services.ts`**
- Vollständiges Type-System
- FormField, PdfSettings, ProcessedPdfResult
- Error Types & Codes

## Quick Start

### 1. Installation

```bash
cd /g/website/verynew/glxy-gaming

# Optional: Adobe PDF Services SDK (für Production)
# npm install @adobe/pdfservices-node-sdk
```

### 2. Environment Setup

Füge zu `.env.local` hinzu (optional für Mock-Modus):

```bash
# Adobe PDF Services (Optional - Mock-Modus läuft ohne)
ADOBE_CLIENT_ID=MOCK_CLIENT_ID
ADOBE_CLIENT_SECRET=MOCK_CLIENT_SECRET
ADOBE_ORG_ID=MOCK_ORG_ID

# PDF Limits
PDF_MAX_FILE_SIZE=10485760
PDF_DOWNLOAD_EXPIRY_HOURS=24
```

### 3. Server starten

```bash
npm run dev
```

### 4. Test durchführen

```bash
# Automatischer Test aller Endpoints
npm run test:pdf-services
# oder
tsx scripts/test-pdf-services.ts
```

## API Verwendung

### PDF generieren

```javascript
const response = await fetch('/api/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: [
      { id: '1', name: 'firstName', type: 'text', label: 'First Name', value: 'John', required: true },
      { id: '2', name: 'email', type: 'email', label: 'Email', value: 'john@example.com' }
    ],
    template: 'contact-form',
    settings: {
      pageSize: 'A4',
      orientation: 'Portrait',
      fillable: false,
      encrypted: false
    }
  })
})

const result = await response.json()
if (result.success) {
  window.location.href = result.downloadUrl
}
```

### PDF verarbeiten

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
console.log(result.data.extractedText)
console.log(result.data.formFields)
```

## Dateien-Übersicht

```
/g/website/verynew/glxy-gaming/
├── app/api/
│   ├── process-pdf/
│   │   ├── route.ts                          # Upload & Processing
│   │   └── download/[fileId]/route.ts        # Download Processed
│   └── generate-pdf/
│       ├── route.ts                          # PDF Generation
│       └── download/[fileId]/route.ts        # Download Generated
├── lib/
│   ├── adobe-pdf-services.ts                 # PDF Services Client
│   └── validations/
│       └── pdf-validation.ts                 # Zod Schemas
├── types/
│   └── pdf-services.ts                       # Type Definitions
├── scripts/
│   └── test-pdf-services.ts                  # Integration Tests
└── docs/
    └── ADOBE_PDF_SERVICES_SETUP.md           # Ausführliche Doku
```

## Mock vs. Production

### Mock-Modus (Aktuell)
- Automatisch aktiv wenn `ADOBE_CLIENT_ID` nicht gesetzt
- Keine Adobe API-Calls
- Minimale aber valide PDFs
- Keine Kosten
- Perfekt für Development & Testing

### Production-Modus
1. Adobe Account erstellen (https://developer.adobe.com/)
2. Credentials generieren
3. SDK installieren: `npm install @adobe/pdfservices-node-sdk`
4. Environment Variables setzen
5. Code in `lib/adobe-pdf-services.ts` anpassen (TODO-Kommentare)

Siehe `/docs/ADOBE_PDF_SERVICES_SETUP.md` für Details.

## Sicherheit

- File Upload Validation (MIME, Size, Magic Bytes)
- Filename Sanitization
- Path Traversal Protection
- Optional Authentication
- Error Handling ohne Info-Leaks
- Buffer Validation

## Testing

```bash
# API-Tests
npm run test:pdf-services

# E2E-Tests (wenn vorhanden)
npm run test:e2e:web-adobe

# Manual Testing
curl -X GET http://localhost:3000/api/generate-pdf
curl -X GET http://localhost:3000/api/process-pdf
```

## Troubleshooting

### Server startet nicht
- Prüfe ob Port 3000 frei ist
- Prüfe `.env.local` Konfiguration

### "File is not a valid PDF"
- Stelle sicher Datei beginnt mit `%PDF`
- Prüfe MIME-Type: `application/pdf`

### "Adobe PDF Services not configured"
- Normal im Mock-Modus
- Für Production: Siehe Setup-Guide

## Nächste Schritte

1. **Frontend-Integration**: React-Komponenten für File-Upload
2. **Database-Schema**: PdfDocument-Model erweitern falls nötig
3. **Batch-Processing**: Mehrere PDFs gleichzeitig
4. **Webhooks**: Async-Processing mit Callbacks
5. **S3-Storage**: Alternative zu lokalem Filesystem

## Support

- Haupt-Dokumentation: `/docs/ADOBE_PDF_SERVICES_SETUP.md`
- Type-Definitionen: `/types/pdf-services.ts`
- Validierungs-Schemas: `/lib/validations/pdf-validation.ts`

## Version

- Version: 1.0.0
- Erstellt: 2025-10-07
- Status: Development Ready (Mock-Modus)
- Produktionsreif: Ja (mit Adobe SDK)
