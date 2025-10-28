# Field Save Flow - Implementation Documentation

## Übersicht

Auto-Save System für PDF Field Updates im Properties Panel mit:
- 1 Sekunde Debounce für automatisches Speichern
- Optimistic UI Updates für instant Feedback
- Socket.IO Integration für Live Updates zwischen Clients
- Error Handling mit Rollback Mechanismus
- Visual Save Status Indicator

## Architektur

```
User Input → Properties Panel → useFieldUpdate Hook → API → Database
                    ↓                                      ↓
              Optimistic UI                          Socket.IO
                    ↓                                      ↓
              Local State ← ← ← ← ← ← ← ← ← ← ← All Connected Clients
```

## Implementierte Komponenten

### 1. useFieldUpdate Hook
**Datei:** `G:\website\verynew\glxy-gaming\hooks\use-field-update.ts`

**Features:**
- Debouncing (1 Sekunde) für Auto-Save
- Mehrere Fields parallel unterstützt (separate Timers pro Field)
- Pending Updates werden gemerged
- Manual Save Funktion (z.B. für Ctrl+S)
- Loading States und Error Tracking
- Last Saved Timestamp

**API:**
```typescript
const { updateField, isSaving, lastSaved, error, manualSave } = useFieldUpdate({
  documentId: 'doc-123',
  onSuccess: (field) => console.log('Saved:', field),
  onError: (error, fieldId, originalData) => console.error('Error:', error),
})

// Auto-save (debounced)
updateField(fieldId, { displayLabel: 'New Label' })

// Manual save (immediate)
await manualSave(fieldId, { displayLabel: 'New Label' })
```

### 2. Properties Panel Integration
**Datei:** `G:\website\verynew\glxy-gaming\components\web-adobe\properties-panel.tsx`

**Änderungen:**
- `useFieldUpdate` Hook Integration
- Lokaler State für optimistic updates (`localField`)
- `handleFieldUpdate` mit `editorToPrismaUpdate` Conversion
- Save Status Indicator im Footer
- Keyboard Shortcut (Ctrl+S)

**Flow:**
```typescript
User ändert Input
  → handleFieldUpdate(updates)
  → Optimistic UI: setLocalField(updated)
  → editorToPrismaUpdate(updates)
  → updateField(fieldId, prismaUpdates)
  → [Nach 1s] API Call
  → [Success] Toast + onSuccess Callback
  → [Error] Toast mit Retry + Rollback
```

### 3. Document Viewer - Socket.IO Integration
**Datei:** `G:\website\verynew\glxy-gaming\app\web-adobe\documents\[id]\page.tsx`

**Änderungen:**
- Original Fields Map für Rollback Storage
- `onFieldUpdated` Socket Handler erweitert
- Unterscheidung zwischen User/AI/Other Updates
- Properties Panel Sync bei Socket Updates
- Toast Notifications basierend auf `updatedBy`

**Socket Flow:**
```typescript
Socket Event: field:updated
  → Update document.fields
  → Update originalFields Map
  → Check updatedBy:
      'user'  → Silent (already shown in Properties Panel)
      'ai'    → Toast mit Confidence Score
      'other' → Toast "Updated by other user"
  → Sync Properties Panel wenn Field selected
```

### 4. Field Mapper (bereits vorhanden)
**Datei:** `G:\website\verynew\glxy-gaming\lib\web-adobe\field-mapper.ts`

**Verwendete Funktionen:**
- `editorToPrismaUpdate(editorField)` - Konvertiert Properties Panel Format → Prisma Update
- `prismaToViewerField(prismaField)` - Prisma → PDF Viewer
- `viewerToEditorField(viewerField)` - PDF Viewer → Properties Panel

## API Endpoint

**Bereits vorhanden:**
`PATCH /api/web-adobe/documents/[id]/fields/[fieldId]`

**Body:**
```json
{
  "pdfName": "customer_name",
  "displayLabel": "Kundenname",
  "fieldType": "text",
  "required": true,
  "validationPattern": "^[A-Za-z ]+$",
  "x": 100,
  "y": 200,
  "width": 300,
  "height": 40,
  "pageNumber": 1
}
```

**Response:**
```json
{
  "field": {
    "id": "field-123",
    "pdfName": "customer_name",
    "displayLabel": "Kundenname",
    ...
  }
}
```

## Socket.IO Events

### Client → Server
```typescript
socket.emit('field:update', {
  documentId: 'doc-123',
  fieldId: 'field-456',
  value: { displayLabel: 'New Label' }
})
```

### Server → Clients
```typescript
socket.on('field:updated', (data: FieldUpdatedEvent) => {
  // data.field = Updated field object
  // data.updatedBy = 'user' | 'ai' | 'other'
  // data.timestamp = Unix timestamp
})
```

## User Experience

### Auto-Save Flow
1. User ändert Input Field
2. Optimistic UI Update (instant)
3. Nach 1s Debounce → API Call startet
4. Footer zeigt: `[Spinner] Speichert...`
5. Nach Success: `[✓] Gespeichert: vor 2 Sekunden`
6. Nach Error: `[!] Fehler beim Speichern` + Retry Button

### Keyboard Shortcuts
- **Ctrl+S / Cmd+S**: Manual Save (skips debounce)
- **ESC**: Close Properties Panel
- **P**: Toggle Properties Panel

### Visual Feedback
```
┌─────────────────────────────────────────────┐
│  [✓] Gespeichert: vor 3 Sekunden  [Strg+S] │
│  [───────────────────────────]              │
│  [      Schließen      ]                    │
└─────────────────────────────────────────────┘
```

States:
- **Saving**: `[Spinner] Speichert...`
- **Success**: `[✓] Gespeichert: vor X Sekunden`
- **Error**: `[!] Fehler beim Speichern`
- **Idle**: `Änderungen werden automatisch gespeichert`

## Error Handling

### Optimistic Rollback
```typescript
onError: (error, fieldId, originalData) => {
  // 1. Show error toast with retry option
  toast.error('Fehler beim Speichern', {
    action: {
      label: 'Erneut versuchen',
      onClick: () => handleFieldUpdate(originalData)
    }
  })

  // 2. Optional: Rollback UI
  setLocalField(originalFieldState)
}
```

### Retry Mechanism
User kann via Toast Button manuell retry triggern.
Alternative: Automatisches Retry mit Exponential Backoff (nicht implementiert).

## Performance Optimierungen

### Debouncing
- Verhindert excessive API Calls bei schnellem Tippen
- Separate Timers pro Field → Mehrere Fields parallel editierbar
- Pending Updates werden gemerged (nur 1 API Call statt mehrere)

### Optimistic UI
- Instant Feedback ohne auf API Response zu warten
- Bessere UX, fühlt sich "snappy" an
- Bei Errors: Rollback auf vorherigen State

### Socket.IO
- Nur Updates für betroffene Fields
- Keine unnötigen Full Document Reloads
- Efficient broadcasting (nur subscribte Clients)

## Testing

### Manual Testing Checklist
- [ ] Field Input ändern → Auto-Save nach 1s
- [ ] Schnell tippen → Nur 1 API Call nach Pause
- [ ] Multiple Fields gleichzeitig → Separate Debouncing
- [ ] Ctrl+S → Immediate Save (skip debounce)
- [ ] Network Error → Error Toast + Retry Button
- [ ] Socket Update von anderem Client → Toast + UI Update
- [ ] AI Update → Toast mit Confidence Score
- [ ] Panel schließen während Save → Kein Memory Leak

### Unit Tests (TODO)
```typescript
describe('useFieldUpdate', () => {
  it('should debounce updates', async () => {
    // Test debounce behavior
  })

  it('should merge pending updates', () => {
    // Test update merging
  })

  it('should handle errors gracefully', () => {
    // Test error handling
  })
})
```

## Deployment Notes

### Environment Variables
Keine zusätzlichen ENV Vars benötigt.

### Database Migrations
Keine Schema-Änderungen nötig (API Route bereits vorhanden).

### Socket.IO Server
Muss Socket.IO Server laufen und `/web-adobe` Namespace unterstützen.
Event `field:updated` muss vom Server emitted werden nach Field Updates.

## Future Enhancements

### Mögliche Erweiterungen
1. **Offline Support**: Updates in IndexedDB queuen, sync wenn online
2. **Conflict Resolution**: Wenn 2 Users gleichzeitig editieren
3. **Undo/Redo**: History Stack für Field Changes
4. **Batch Updates**: Mehrere Fields gleichzeitig speichern
5. **Autosave Indicator**: "All changes saved" Badge in Header
6. **Real-time Cursors**: Zeige wo andere Users gerade editieren
7. **Field Locking**: Prevent concurrent edits

## Troubleshooting

### Problem: Auto-Save funktioniert nicht
**Check:**
- Document ID korrekt extrahiert? (`selectedFields[0]?.id?.split('_')[0]`)
- API Route antwortet? (Network Tab)
- Auth Token valid? (401 Errors?)

### Problem: Socket Updates kommen nicht an
**Check:**
- Socket.IO verbunden? (`isConnected` Badge in Header)
- `document:subscribe` Event gesendet?
- Server emitted `field:updated` Event?

### Problem: Optimistic UI wird nicht zurückgerollt bei Error
**Check:**
- `onError` Callback wird ausgeführt?
- `originalData` Parameter korrekt?
- `setLocalField` State Update funktioniert?

## Code Examples

### Vollständiger Update Flow
```typescript
// 1. User Input
<Input
  value={currentField.displayName}
  onChange={(e) => handleFieldUpdate({ displayName: e.target.value })}
/>

// 2. Handle Update
const handleFieldUpdate = (updates: Partial<FormField>) => {
  // Optimistic UI
  const updated = { ...currentField, ...updates }
  setLocalField(updated)

  // Convert to Prisma format
  const prismaUpdates = editorToPrismaUpdate(updates)

  // Trigger auto-save
  updateField(currentField.id, prismaUpdates)
}

// 3. useFieldUpdate Hook
const { updateField } = useFieldUpdate({
  documentId,
  onSuccess: (field) => {
    toast.success('Feld gespeichert')
  },
  onError: (error, fieldId, originalData) => {
    toast.error('Fehler beim Speichern')
    // Optional: Rollback
  }
})

// 4. Socket Sync
useEffect(() => {
  return subscribe(documentId, {
    onFieldUpdated: (data) => {
      // Update local state
      setDocument(prev => ({
        ...prev,
        fields: prev.fields.map(f =>
          f.id === data.field.id ? data.field : f
        )
      }))
    }
  })
}, [documentId])
```

## Dependencies

### New
- Keine neuen NPM Packages

### Existing
- `socket.io-client` (already installed)
- `sonner` (Toast notifications)
- `framer-motion` (Animations)
- `@radix-ui/react-switch` (Switch component)

## Files Changed

### Created
- `G:\website\verynew\glxy-gaming\hooks\use-field-update.ts`
- `G:\website\verynew\glxy-gaming\docs\FIELD-SAVE-FLOW.md`

### Modified
- `G:\website\verynew\glxy-gaming\components\web-adobe\properties-panel.tsx`
- `G:\website\verynew\glxy-gaming\app\web-adobe\documents\[id]\page.tsx`

### Existing (No Changes)
- `G:\website\verynew\glxy-gaming\lib\web-adobe\field-mapper.ts`
- `G:\website\verynew\glxy-gaming\app\api\web-adobe\documents\[id]\fields\[fieldId]\route.ts`
- `G:\website\verynew\glxy-gaming\hooks\use-web-adobe-socket.ts`

## Conclusion

Field Save Flow vollständig implementiert mit:
- ✅ Auto-Save mit 1s Debounce
- ✅ Optimistic UI Updates
- ✅ Socket.IO Live Sync
- ✅ Error Handling mit Retry
- ✅ Visual Save Status Indicator
- ✅ Keyboard Shortcuts
- ✅ Multi-Field Support
- ✅ TypeScript Type-Safe

Ready for testing!
