# Document Viewer Page

**Route:** `/web-adobe/documents/[id]`

## Übersicht

Diese Dynamic Route zeigt ein einzelnes PDF-Dokument mit interaktivem PDF Viewer und Properties Panel im Side-by-Side Layout.

## Features

### Layout (Desktop)
```
┌─────────────────────────────────────────────┐
│ Header: Back | Title | Status | Actions    │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   PDF Viewer (70%)   │  Properties (30%)   │
│   - Zoom Controls    │  - 5 Tabs           │
│   - Page Nav         │  - Field Editor     │
│   - Field Overlays   │  - Live Updates     │
│                      │                      │
└──────────────────────┴──────────────────────┘
│ Footer: Stats | Last Modified              │
└─────────────────────────────────────────────┘
```

### Responsive
- **Desktop:** Side-by-Side (70/30)
- **Tablet:** Properties als Overlay
- **Mobile:** Full-width Viewer, Properties als Bottom Sheet

## Architektur

### API Route
**GET** `/api/web-adobe/documents/[id]`

Response:
```typescript
{
  document: PdfDocument & {
    fields: PdfField[]
  },
  pdfDataUrl: string // Base64 Data URL
}
```

**PATCH** `/api/web-adobe/documents/[id]`

Body: `{ title?, status? }`

**DELETE** `/api/web-adobe/documents/[id]`

### Field Update API
**PATCH** `/api/web-adobe/documents/[id]/fields/[fieldId]`

Body: Partial field updates

### Field Mapping Pipeline

```
Database (Prisma PdfField)
         ↓
batchPrismaToViewer() → PDF Viewer FormField
         ↓
User clicks field
         ↓
viewerToEditorField() → Properties Panel FormField
         ↓
User edits properties
         ↓
editorToPrismaUpdate() → Database Update
         ↓
Socket.IO broadcasts update
         ↓
All clients sync
```

## Socket.IO Integration

Der Viewer subscribed automatisch zu Real-time Updates:

```typescript
subscribe(documentId, {
  onFieldUpdated: (data) => {
    // Field wurde von anderem User/AI bearbeitet
  },
  onComplete: (data) => {
    // AI-Analyse abgeschlossen
  },
  onError: (data) => {
    // Fehler bei Verarbeitung
  }
})
```

## Components

### Verwendete Komponenten

- `<PdfViewer>` - G:\website\verynew\glxy-gaming\components\web-adobe\pdf-viewer.tsx
- `<PropertiesPanel>` - G:\website\verynew\glxy-gaming\components\web-adobe\properties-panel.tsx
- `usePropertiesPanel()` - G:\website\verynew\glxy-gaming\hooks\use-properties-panel.ts
- `useWebAdobeSocket()` - G:\website\verynew\glxy-gaming\hooks\use-web-adobe-socket.ts

### Field Mapper Utilities

File: `lib/web-adobe/field-mapper.ts`

- `prismaToViewerField()` - DB → PDF Viewer
- `viewerToEditorField()` - PDF Viewer → Properties Panel
- `editorToPrismaUpdate()` - Properties Panel → DB Update
- `batchPrismaToViewer()` - Batch conversion

## User Flow

1. **Dokument öffnen**
   - User klickt auf Dokument in Liste
   - Route lädt: `/web-adobe/documents/{id}`

2. **PDF lädt**
   - API lädt Dokument + Fields aus DB
   - PDF wird als Base64 Data URL geladen
   - Viewer rendert PDF mit Field Overlays

3. **Field bearbeiten**
   - User klickt auf Field im PDF
   - Properties Panel öffnet sich (rechts)
   - User bearbeitet Properties in 5 Tabs
   - Save → API PATCH → DB Update

4. **Live Updates**
   - Socket.IO emittiert `field:updated` Event
   - Alle verbundenen Clients aktualisieren UI
   - Toast Notification zeigt Update an

5. **Document Actions**
   - Download PDF (Data URL → Blob Download)
   - Delete Document (mit Bestätigung)
   - Status ändern (Dropdown in Header)

## Error Handling

### 404 - Document not found
Redirect zu `/web-adobe/documents` mit Error Toast

### 403 - Access Denied
User darf nur eigene Dokumente sehen (userId Check)

### PDF Load Error
Fallback: Zeige Dokument-Metadaten ohne PDF

### Socket Disconnect
Badge zeigt Connection Status (Live/Offline)

## Performance

### PDF Streaming
- Base64 Data URL für direktes Browser-Rendering
- Kein Download auf Filesystem nötig
- Memory-effizient durch Browser-native PDF.js

### Field Virtualization
- Nur Fields der aktuellen Seite werden gerendert
- Overlay nutzt CSS Transform für Performance

### Debouncing
- Field Updates werden debounced (300ms)
- Verhindert API-Spam bei schnellen Änderungen

## Testing

### Manual Testing Checklist

- [ ] Dokument lädt korrekt
- [ ] PDF wird angezeigt
- [ ] Field Overlays sichtbar
- [ ] Field Click öffnet Properties Panel
- [ ] Properties bearbeitbar
- [ ] Save speichert in DB
- [ ] Socket.IO verbindet
- [ ] Live Updates funktionieren
- [ ] Download funktioniert
- [ ] Delete mit Bestätigung
- [ ] 404 Error handling
- [ ] 403 Access denied

### API Testing

```bash
# Get Document
curl http://localhost:3000/api/web-adobe/documents/{id} \
  -H "Cookie: next-auth.session-token=..."

# Update Document
curl -X PATCH http://localhost:3000/api/web-adobe/documents/{id} \
  -H "Content-Type: application/json" \
  -d '{"title": "Neuer Titel"}'

# Update Field
curl -X PATCH http://localhost:3000/api/web-adobe/documents/{id}/fields/{fieldId} \
  -H "Content-Type: application/json" \
  -d '{"required": true}'

# Delete Document
curl -X DELETE http://localhost:3000/api/web-adobe/documents/{id}
```

## Known Issues

- PDF.js Worker muss konfiguriert sein (siehe pdf-renderer.ts)
- Base64 Encoding kann bei großen PDFs langsam sein (>10MB)
- Socket.IO benötigt `/api/socket/io` Route

## Future Enhancements

- [ ] Collaborative Editing (Multiple Cursors)
- [ ] Undo/Redo History
- [ ] Field Annotations
- [ ] PDF Export with filled values
- [ ] Bulk Field Operations
- [ ] Field Templates
- [ ] AI-assisted Field Detection
- [ ] Version Control

## File Locations

```
app/
  web-adobe/
    documents/
      [id]/
        page.tsx          # Main Page Component
        README.md         # This file

app/api/
  web-adobe/
    documents/
      [id]/
        route.ts          # GET, PATCH, DELETE
        fields/
          [fieldId]/
            route.ts      # PATCH Field

lib/
  web-adobe/
    field-mapper.ts       # Field transformation utilities

components/
  web-adobe/
    pdf-viewer.tsx        # PDF Viewer Component
    properties-panel.tsx  # Properties Panel Component

hooks/
  use-properties-panel.ts
  use-web-adobe-socket.ts
```

## Dependencies

- Next.js 14+ (App Router)
- Prisma (Database ORM)
- Socket.IO (Real-time)
- PDF.js (PDF Rendering)
- Zustand (State Management)
- Framer Motion (Animations)
- Sonner (Toast Notifications)
