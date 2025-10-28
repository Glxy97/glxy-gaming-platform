# Web-Adobe Documents List Page

Vollständige Document Management Implementierung für die Web-Adobe PDF Integration.

## Features

### Document List View
- Tabellarische Darstellung aller PDF-Dokumente
- Farbcodierte Status Badges (DRAFT, ANALYZING, REVIEW, SYNCED, ERROR)
- Field Count pro Dokument
- Dateigröße und Seitenanzahl
- Erstellungsdatum mit deutscher Formatierung

### Search & Filter
- Live-Search (debounced) nach Titel und Dateiname
- Status-Filter Dropdown (Alle, Draft, Analyzing, Review, Synced, Error)
- Pagination (20 Dokumente pro Seite)
- Document Count Anzeige

### Actions
- **View**: Öffnet Dokument-Detailansicht (`/web-adobe/documents/[id]`)
- **Edit Fields**: Öffnet Field Editor (`/web-adobe/documents/[id]/edit`)
- **Download**: Lädt PDF-Datei herunter
- **Delete**: Löscht Dokument mit Bestätigungsdialog

### UI/UX
- Server-Side Rendering für initiale Daten (SEO)
- Client-Side Hydration für Interaktivität
- Loading States mit Skeleton Components
- Error States mit Retry Functionality
- Empty States mit Upload-Button
- Toast Notifications (Sonner)
- Responsive Design (Mobile & Desktop)

## Implementierte Files

### API Routes

#### `app/api/web-adobe/documents/route.ts`
- **GET**: Paginated document list mit filters
  - Query Params: `status`, `search`, `limit`, `offset`
  - Returns: `{ documents, total, hasMore, limit, offset }`
- **POST**: Create new document

#### `app/api/web-adobe/documents/[id]/route.ts`
- **GET**: Single document mit fields
- **DELETE**: Delete document + file from filesystem
- **PATCH**: Update document metadata (title, status)

#### `app/api/web-adobe/documents/[id]/download/route.ts`
- **GET**: Stream PDF file mit proper headers

### Frontend Components

#### `app/web-adobe/documents/page.tsx`
Server Component mit:
- Auth Check (redirect to signin)
- Server-side initial fetch
- SEO Metadata
- Header mit Upload Button
- Filter Controls
- Document Count
- Suspense Boundary für List

#### `components/web-adobe/document-list.tsx`
Client Component mit:
- Table Layout (Shadcn/UI)
- Status Badges (color-coded)
- Actions Dropdown (View, Edit, Download, Delete)
- Pagination Controls
- Loading/Error/Empty States
- Optimistic UI für Delete

#### `components/web-adobe/document-search.tsx`
Client Component mit:
- Debounced Search Input (300ms)
- URL State Management
- Auto-reset to page 1

#### `components/web-adobe/document-status-filter.tsx`
Client Component mit:
- Status Dropdown (Shadcn/UI Select)
- URL State Management
- Auto-reset to page 1

#### `components/web-adobe/document-refresh-button.tsx`
Client Component mit:
- Router.refresh() für Server-side Refetch
- Icon Button (RefreshCw)

### Types

#### `types/web-adobe.ts`
TypeScript Definitions:
- `PdfDocumentWithCount`: Document mit Field Count
- `PdfDocumentWithFields`: Document mit full Fields Array
- `DocumentListResponse`: API Response Type
- `CreateDocumentRequest`: API Request Type
- `STATUS_CONFIG`: Status Label & Color Mapping
- `FIELD_STATUS_CONFIG`: Field Status Mapping

## Database Schema (Prisma)

```prisma
model PdfDocument {
  id          String            @id @default(cuid())
  userId      String
  title       String
  filename    String
  storagePath String
  status      PdfDocumentStatus @default(DRAFT)
  checksum    String?
  pageCount   Int?
  fileSize    Int?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(...)
  fields      PdfField[]

  @@index([userId])
  @@index([status])
  @@index([userId, status])
}

enum PdfDocumentStatus {
  DRAFT
  ANALYZING
  REVIEW
  SYNCED
  ERROR
}
```

## Security

### Authentication
- NextAuth.js Session Check in allen API Routes
- Auth Helper: `auth()` from `@/lib/auth`
- Redirect to signin wenn nicht authentifiziert

### Authorization
- User-Ownership Check: `document.userId === session.user.id`
- Forbidden (403) wenn User nicht Owner
- Cascade Delete: Felder werden automatisch gelöscht

### File System
- Validate File Path vor Delete/Download
- Error Handling für fehlende Dateien
- Continue on File Delete Error (DB bereits clean)

## Performance

### Server-Side Rendering
- Initial Fetch für SEO & LCP
- Prisma Query mit `_count` Select (optimiert)
- Parallel Queries: `Promise.all([findMany, count])`

### Client-Side Optimization
- Debounced Search (300ms)
- Pagination (20 docs pro page)
- Skeleton Loading States
- Optimistic UI für Delete

### Database Indexes
```prisma
@@index([userId])
@@index([status])
@@index([userId, status])
```

## Usage

### Als User
1. Navigate zu `/web-adobe/documents`
2. Siehe alle eigenen PDF-Dokumente
3. Suche nach Titel/Dateiname
4. Filtere nach Status
5. Click auf Row → Detail View
6. Click auf Actions → View/Edit/Download/Delete

### Als Developer
```typescript
// Fetch documents
const response = await fetch('/api/web-adobe/documents?status=DRAFT&search=invoice&limit=20&offset=0')
const data: DocumentListResponse = await response.json()

// Delete document
await fetch(`/api/web-adobe/documents/${id}`, { method: 'DELETE' })

// Download document
const blob = await fetch(`/api/web-adobe/documents/${id}/download`).then(r => r.blob())
```

## Testing Checklist

- [ ] Page lädt korrekt mit Auth
- [ ] Redirect zu Signin ohne Auth
- [ ] Document List zeigt alle User-Dokumente
- [ ] Search funktioniert (Title & Filename)
- [ ] Status Filter funktioniert
- [ ] Pagination funktioniert
- [ ] View Action öffnet Detail Page
- [ ] Edit Action öffnet Field Editor
- [ ] Download Action lädt PDF herunter
- [ ] Delete Action löscht Document + File
- [ ] Loading States sichtbar
- [ ] Error States sichtbar (Network Error)
- [ ] Empty State sichtbar (keine Docs)
- [ ] Toast Notifications erscheinen
- [ ] Responsive Design (Mobile/Desktop)

## Future Enhancements

- [ ] Bulk Actions (Multi-Select Delete)
- [ ] Bulk Status Update
- [ ] Sort Columns (Click Header)
- [ ] Card View als Alternative zu Table
- [ ] Drag & Drop Upload
- [ ] PDF Thumbnail Previews
- [ ] Export to CSV/Excel
- [ ] Advanced Filters (Date Range, File Size)
- [ ] Infinite Scroll statt Pagination
- [ ] Real-time Updates (WebSocket)

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "next-auth": "^5.0.0-beta",
    "@prisma/client": "^5.0.0",
    "sonner": "^1.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

## Related Documentation

- [Prisma Schema](../../../prisma/schema.prisma)
- [Web-Adobe Components](../../../components/web-adobe/README.md)
- [NextAuth Config](../../../lib/auth.ts)
- [TypeScript Types](../../../types/web-adobe.ts)
