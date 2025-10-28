# Web-Adobe Properties Panel - Komponenten-Struktur

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web-Adobe App                            │
│                                                                   │
│  ┌──────────────────┐                    ┌────────────────────┐ │
│  │                  │                    │                    │ │
│  │   PDF Viewer     │◄──────────────────│ Properties Panel   │ │
│  │                  │  Field Selection   │                    │ │
│  │  - PDF Display   │                    │ - Slide-In Panel   │ │
│  │  - Field Overlay │────────────────────┤ - 6 Sections       │ │
│  │  - Zoom/Pan      │   Update Props     │ - Auto-Save        │ │
│  │  - Context Menu  │                    │ - Keyboard         │ │
│  │                  │                    │                    │ │
│  └──────────────────┘                    └────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Komponenten-Hierarchie

```
PropertiesPanel
├── Header
│   ├── Title + Icon
│   ├── Copy/Paste Buttons (Tooltips)
│   ├── Pin/Unpin Button
│   └── Close Button (X)
│
├── ScrollArea (Content)
│   │
│   ├── BulkEditPanel (if multi-select)
│   │   ├── Field Count Badge
│   │   ├── Info Banner
│   │   ├── Common Properties
│   │   │   ├── Field Type (read-only, mixed indicator)
│   │   │   ├── Required Toggle (mixed state)
│   │   │   ├── Font Size Input (mixed badge)
│   │   │   └── Read-only Toggle (mixed state)
│   │   └── Selected Fields List
│   │
│   └── Single Field Edit (if single select)
│       │
│       ├── FieldPropertySection "Basis" 📋
│       │   ├── PropertyRow: Feldname *
│       │   │   └── Input (validated)
│       │   ├── PropertyRow: Anzeigename
│       │   │   └── Input
│       │   ├── PropertyRow: Typ *
│       │   │   └── FieldTypeSelect
│       │   │       ├── SelectGroup "Eingabefelder"
│       │   │       │   ├── Text 📝
│       │   │       │   ├── Textarea 📄
│       │   │       │   ├── Number 🔢
│       │   │       │   ├── Email 📧
│       │   │       │   ├── Phone 📞
│       │   │       │   └── Date 📅
│       │   │       ├── SelectGroup "Auswahlfelder"
│       │   │       │   ├── Checkbox ☑️
│       │   │       │   ├── Radio 🔘
│       │   │       │   └── Dropdown 📋
│       │   │       └── SelectGroup "Spezialfelder"
│       │   │           └── Signature ✍️
│       │   └── PropertyRow: Beschreibung
│       │       └── Textarea
│       │
│       ├── FieldPropertySection "Validierung" ✓
│       │   └── ValidationBuilder
│       │       ├── Tabs (Email, Phone, Date, Custom)
│       │       │   ├── TabsContent: Preset Display
│       │       │   │   ├── Description Badge
│       │       │   │   ├── Example Code
│       │       │   │   ├── Pattern Input (read-only)
│       │       │   │   └── Error Message Input (read-only)
│       │       │   └── TabsContent: Custom
│       │       │       ├── Pattern Textarea (editable)
│       │       │       └── Error Message Input (editable)
│       │       └── Live-Test Section
│       │           ├── Test Input + Button
│       │           └── Result Display (✅ Gültig / ❌ Ungültig)
│       │
│       ├── FieldPropertySection "Darstellung" 🎨
│       │   ├── PropertyRow: Schriftgröße
│       │   │   └── Number Input + Unit Label "pt"
│       │   ├── PropertyRow: Textfarbe
│       │   │   └── Color Input
│       │   ├── PropertyRow: Rahmen
│       │   │   ├── Style Select (Durchgezogen, Gestrichelt, etc.)
│       │   │   ├── Width Input
│       │   │   └── Color Input
│       │   └── PropertyRow: Hintergrund
│       │       ├── Type Select (Transparent, Weiß, etc.)
│       │       └── Color Input (if custom)
│       │
│       ├── FieldPropertySection "Verhalten" ⚡
│       │   └── PositionEditor
│       │       ├── Mini Preview (with Grid)
│       │       ├── Position Grid (2x2)
│       │       │   ├── X Position (-, Input, +)
│       │       │   ├── Y Position (-, Input, +)
│       │       │   ├── Width (-, Input, +)
│       │       │   └── Height (-, Input, +)
│       │       ├── Snap to Grid Toggle + Size Input
│       │       └── Alignment Tools (3x2 Grid)
│       │           ├── Row 1: Left, Center, Right
│       │           └── Row 2: Vertical Distribute, Horizontal Distribute
│       │
│       ├── FieldPropertySection "Position & Größe" 📐
│       │   ├── PropertyRow: Schreibgeschützt
│       │   │   └── Toggle
│       │   ├── PropertyRow: Ausgeblendet
│       │   │   └── Toggle
│       │   ├── PropertyRow: Mehrere Zeilen
│       │   │   └── Toggle + Rows Input
│       │   ├── PropertyRow: Deaktiviert
│       │   │   └── Toggle
│       │   └── PropertyRow: Auto-Fokus
│       │       └── Toggle
│       │
│       └── FieldPropertySection "dataPad Integration" 🔗
│           └── DataPadMapper
│               ├── Connection Status Badge
│               │   └── "Verbunden" ✅ / "Nicht verbunden"
│               ├── Mapping Key Select
│               │   ├── Category Header "Kunde"
│               │   │   ├── customer.firstName
│               │   │   ├── customer.lastName
│               │   │   ├── customer.email
│               │   │   └── customer.phone
│               │   ├── Category Header "Adresse"
│               │   │   ├── address.street
│               │   │   ├── address.postalCode
│               │   │   ├── address.city
│               │   │   └── address.country
│               │   ├── Category Header "Bestellung"
│               │   │   ├── order.number
│               │   │   ├── order.date
│               │   │   └── order.total
│               │   └── Category Header "Benutzer"
│               │       ├── user.username
│               │       └── user.role
│               ├── Auto-Fill Toggle
│               ├── Sync Direction Select
│               │   ├── PDF → dataPad
│               │   ├── dataPad → PDF
│               │   └── Bidirektional ⇄
│               ├── Test Connection Button
│               │   └── Spinner (when testing)
│               ├── Test Result Display
│               │   └── Success ✅ / Error ❌ + Message
│               └── Preview Section
│                   └── Info Text + Mapping Key
│
└── Footer (if field selected)
    ├── Speichern Button (primary)
    └── Abbrechen Button (outline)
```

## 🔄 Datenfluss

```
User Action
    │
    ├─ Field Click ────────────────────┐
    │                                  │
    ├─ Keyboard Shortcut ─────────────┤
    │                                  │
    └─ Multi-Select ──────────────────┤
                                       ▼
                            ┌──────────────────┐
                            │ usePropertiesPanel│
                            │     (Hook)       │
                            └──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
          │   openPanel()   │ │ updateProp()│ │ saveProps()  │
          └─────────────────┘ └─────────────┘ └──────────────┘
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
          │  Load Field     │ │ Update State│ │ API Call     │
          │  Properties     │ │ (Optimistic)│ │ (Debounced)  │
          └─────────────────┘ └─────────────┘ └──────────────┘
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────────────────────────────────────┐
          │          Properties Panel Re-render             │
          │                                                 │
          │  - Update Input Values                          │
          │  - Show/Hide Sections                           │
          │  - Display Validation Results                   │
          │  - Update Badges & Status                       │
          └─────────────────────────────────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Toast/Event   │
                              │  Feedback      │
                              └────────────────┘
```

## 🎨 Styling-System

```
Theme Variables (CSS Custom Properties)
├── Colors
│   ├── --background
│   ├── --foreground
│   ├── --primary
│   ├── --secondary
│   ├── --muted
│   ├── --destructive
│   └── --border
│
├── Spacing
│   ├── px-1 (0.25rem)
│   ├── px-2 (0.5rem)
│   ├── px-3 (0.75rem)
│   ├── px-4 (1rem)
│   └── ...
│
├── Typography
│   ├── text-xs (0.75rem)
│   ├── text-sm (0.875rem)
│   ├── text-base (1rem)
│   └── ...
│
└── Animations
    ├── animate-accordion-down
    ├── animate-accordion-up
    └── Framer Motion variants
```

## 📊 State-Management

```typescript
// Zustand Store
interface PropertiesPanelStore {
  // UI State
  isOpen: boolean
  isPinned: boolean
  activeSection: string | null

  // Selection State
  selectedFields: FormField[]

  // Clipboard State
  clipboardProperties: Partial<FormField> | null

  // History State
  history: FieldPropertyChange[]

  // Actions
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setPinned: (pinned: boolean) => void
  setSelectedFields: (fields: FormField[]) => void
  setActiveSection: (section: string | null) => void
  copyProperties: (properties: Partial<FormField>) => void
  pasteProperties: () => Partial<FormField> | null
  addToHistory: (change: FieldPropertyChange) => void
  undo: () => void
}
```

## 🎯 Event-System

```
┌─────────────────────────────────────────────────────────────┐
│                      Event Listeners                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Window Events:                                              │
│  ├─ keydown → Keyboard Shortcuts                            │
│  │   ├─ P → Toggle Panel                                    │
│  │   ├─ Strg+S → Save                                       │
│  │   ├─ Strg+Enter → Save & Close                           │
│  │   ├─ Escape → Close                                      │
│  │   ├─ Strg+C → Copy Properties                            │
│  │   └─ Strg+V → Paste Properties                           │
│  │                                                           │
│  └─ fieldPropertiesUpdated → Custom Event                   │
│      └─ Dispatch when properties saved                      │
│                                                              │
│  Component Events:                                           │
│  ├─ onChange → Input Changes (debounced)                    │
│  ├─ onClick → Button Actions                                │
│  ├─ onToggle → Section Expand/Collapse                      │
│  └─ onSubmit → Form Submission                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Integration Points

```
┌──────────────────────────────────────────────────────┐
│                  External Systems                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. PDF Renderer                                      │
│     ├─ Field Selection → openPanel(fieldId, props)   │
│     ├─ Field Update ← fieldPropertiesUpdated event   │
│     └─ Field Render ← Apply updated properties       │
│                                                       │
│  2. dataPad API                                       │
│     ├─ Schema Fetch → GET /api/datapad/schema        │
│     ├─ Mapping Test → POST /api/datapad/test         │
│     └─ Auto-Fill Data → GET /api/datapad/values      │
│                                                       │
│  3. Backend API                                       │
│     ├─ Save Properties → PUT /api/fields/:id         │
│     ├─ Bulk Update → PATCH /api/fields/bulk          │
│     └─ Validation → POST /api/fields/validate        │
│                                                       │
│  4. Toast System (Sonner)                             │
│     ├─ Success → toast.success(message)              │
│     ├─ Error → toast.error(message)                  │
│     └─ Warning → toast.warning(message)              │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## 📱 Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────┐
│  Mobile (< 640px)                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  │         Properties Panel (Full Width)       │ │ │
│  │  │                                              │ │ │
│  │  │  - Full overlay                              │ │ │
│  │  │  - Backdrop blur                             │ │ │
│  │  │  - Slide from right                          │ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Desktop (≥ 1024px)                                      │
│  ┌────────────────────────┬───────────────────────────┐ │
│  │                        │                           │ │
│  │                        │  ┌─────────────────────┐  │ │
│  │   PDF Viewer           │  │                     │  │ │
│  │   (Dynamic Width)      │  │  Properties Panel   │  │ │
│  │                        │  │  (400px Fixed)      │  │ │
│  │   - Takes remaining    │  │                     │  │ │
│  │     space              │  │  - No backdrop      │  │ │
│  │   - Min 600px          │  │  - Fixed right      │  │ │
│  │                        │  │  - Shadow left      │  │ │
│  │                        │  │                     │  │ │
│  └────────────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🧩 Wiederverwendbare Pattern

### PropertyRow Pattern
```tsx
<PropertyRow
  label="Feldname"
  required
  description="Technischer Name für Identifikation"
>
  <Input
    value={value}
    onChange={handleChange}
    placeholder="z.B. kundenname_vorname"
  />
</PropertyRow>
```

### Toggle Pattern
```tsx
<div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
  <div className="space-y-0.5">
    <Label htmlFor="toggle-id" className="text-sm cursor-pointer">
      Toggle Label
    </Label>
    <p className="text-xs text-muted-foreground">
      Beschreibung
    </p>
  </div>
  <Switch
    id="toggle-id"
    checked={value}
    onCheckedChange={handleChange}
  />
</div>
```

### Status Badge Pattern
```tsx
<div className={cn(
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
  success ? 'bg-green-500/10 text-green-600' : 'bg-muted'
)}>
  {success ? (
    <>
      <CheckCircle2 className="h-4 w-4" />
      <span className="font-medium">Verbunden</span>
    </>
  ) : (
    <>
      <AlertCircle className="h-4 w-4" />
      <span>Nicht verbunden</span>
    </>
  )}
</div>
```

### Collapsible Section Pattern
```tsx
<FieldPropertySection
  title="Section Title"
  icon={<Icon className="h-4 w-4" />}
  defaultOpen={false}
  onToggle={(isOpen) => handleToggle(isOpen)}
>
  {/* Content */}
</FieldPropertySection>
```

## 📚 Weitere Ressourcen

- **Vollständige Dokumentation**: [properties-panel-de.md](./properties-panel-de.md)
- **Deutsche Labels**: `lib/web-adobe/de-labels.ts`
- **Validation Presets**: `lib/web-adobe/validation-presets.ts`
- **Component Code**: `components/web-adobe/`
- **Type Definitions**: `types/web-adobe.ts`

---

**Visualisierung erstellt für vollständiges deutsches Properties Panel** 🇩🇪
