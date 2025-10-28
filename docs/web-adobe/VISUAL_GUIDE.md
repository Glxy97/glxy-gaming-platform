# Web-Adobe Properties Panel - Visual Guide

ASCII-based visual representation der UI-Komponenten.

---

## Full Panel Layout

```
┌────────────────────────────────────────────────────────────┐
│  PDF Editor                                 [Properties] → │
│                                                             │
│  ┌───────────────────────────┐  ┌─────────────────────┐   │
│  │                           │  │ 📋 Eigenschaften    │   │
│  │                           │  │                 [📌][X]│   │
│  │    PDF Preview            │  ├─────────────────────┤   │
│  │                           │  │                     │   │
│  │  ┌─────────────┐         │  │ 📄 Basis        [▼] │   │
│  │  │ [TextField] │         │  │   Feldname: [___]   │   │
│  │  └─────────────┘         │  │   Typ: [Text ▼]     │   │
│  │                           │  │                     │   │
│  │  ┌───┐  ┌───┐            │  │ ✓ Validierung   [▼] │   │
│  │  │[✓]│  │[✓]│            │  │   Pflichtfeld: [✓]  │   │
│  │  └───┘  └───┘            │  │   Regex: [______]   │   │
│  │                           │  │                     │   │
│  └───────────────────────────┘  │ 🎨 Darstellung  [▶] │   │
│                                  │                     │   │
│  [+ Add Field] [⚙️ Settings]    │ ⚡ Verhalten     [▶] │   │
│                                  │                     │   │
│                                  │ 🔗 dataPad      [▶] │   │
│                                  │                     │   │
│                                  └─────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Properties Panel Header

```
┌─────────────────────────────────────┐
│ 📋 Eigenschaften          [📌] [X]  │ ← Header
└─────────────────────────────────────┘
│                                      │
│ [📋] Icon      Title                 │
│                                      │
│ [📌] Pin Button (Toggle sticky)      │
│ [X] Close Button                     │
```

**Features:**
- Drag handle for repositioning
- Pin/Unpin toggle (blue when pinned)
- Close button (ESC also works)

---

### 2. Basis Section (Expanded)

```
┌─────────────────────────────────────┐
│ 📄 Basis                        [▼] │ ← Collapsible Header
├─────────────────────────────────────┤
│ Feldname: *                          │
│ ┌─────────────────────────────────┐ │
│ │ firstName                       │ │ ← Input
│ └─────────────────────────────────┘ │
│                                      │
│ Anzeigename:                         │
│ ┌─────────────────────────────────┐ │
│ │ Vorname                         │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Typ: *                               │
│ ┌─────────────────────────────────┐ │
│ │ Text                        [▼] │ │ ← Dropdown
│ └─────────────────────────────────┘ │
│                                      │
│ Options: Text, Number, Email,        │
│          Date, Checkbox, Radio,      │
│          Dropdown, Signature         │
└─────────────────────────────────────┘
```

**Elements:**
- `*` = Required field indicator
- Input fields with placeholders
- Dropdown with arrow indicator
- Helper text below fields

---

### 3. Validation Builder

```
┌─────────────────────────────────────────────────┐
│ ✓ Validierung                              [▼]  │
├─────────────────────────────────────────────────┤
│ ┌─────┬─────┬───────┬────────┐                 │
│ │Email│ Tel │ Datum │ Custom │ ← Tabs          │
│ └─────┴─────┴───────┴────────┘                 │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Gültige E-Mail-Adresse          [Preset] │   │
│ │ Beispiel: beispiel@domain.de             │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Muster:                                          │
│ ┌──────────────────────────────────────────┐   │
│ │ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+        │   │
│ │ \.[a-zA-Z]{2,}$                          │   │ ← Regex
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Fehlermeldung:                                   │
│ ┌──────────────────────────────────────────┐   │
│ │ Bitte gültige E-Mail eingeben            │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ─────────── Live-Test ───────────               │
│                                                  │
│ ┌──────────────────────────────┐  [Test]        │
│ │ test@example.com             │                │ ← Test Input
│ └──────────────────────────────┘                │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ✓ Gültig                                 │   │ ← Result
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**States:**
- ✅ Valid (green background)
- ❌ Invalid (red background)
- ⏳ Testing (loading spinner)

---

### 4. Position Editor

```
┌─────────────────────────────────────────────────┐
│ ⚡ Verhalten                               [▼]  │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │         Seite 1                           │   │
│ │   ┌─────────────────┐                     │   │
│ │   │   [■ Field]     │ ← Draggable         │   │
│ │   └─────────────────┘                     │   │
│ │                                           │   │
│ │   X: 120  Y: 450                          │   │
│ │   W: 200  H: 30                           │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ X Position:              Y Position:             │
│ [−] [100    ] [+]       [−] [150    ] [+]       │
│                                                  │
│ Breite:                  Höhe:                   │
│ [−] [200    ] [+]       [−] [30     ] [+]       │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 📐 Raster einrasten          [Toggle ✓]  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Rastergröße: [10] px                             │
│                                                  │
│ Ausrichtung:                                     │
│ ┌─────┬─────┬─────┬─────┬─────┐                │
│ │  ◀  │  ●  │  ▶  │  ↕  │  ↔  │                │
│ └─────┴─────┴─────┴─────┴─────┘                │
└─────────────────────────────────────────────────┘
```

**Controls:**
- Mini PDF preview with draggable field
- Number inputs with increment/decrement buttons
- Snap-to-grid toggle with visual grid overlay
- Alignment tools (5 buttons)

---

### 5. DataPad Mapper

```
┌─────────────────────────────────────────────────┐
│ 🔗 dataPad Integration                     [▼]  │
├─────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ ✓ Mit DataPad verbunden                  │   │ ← Status
│ └──────────────────────────────────────────┘   │
│                                                  │
│ DataPad-Feld:                                    │
│ ┌──────────────────────────────────────────┐   │
│ │ Vorname (user.firstName)            [▼]  │   │ ← Dropdown
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Automatisches Ausfüllen      [Toggle ✓]  │   │
│ │ Feld wird auto. mit DataPad gefüllt      │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Synchronisationsrichtung:                        │
│ ┌──────────────────────────────────────────┐   │
│ │ Bidirektional ⇄                     [▼]  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔄 Verbindung testen                     │   │ ← Button
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ✓ Verbindung erfolgreich                 │   │
│ │   Beispielwert: Max Mustermann           │   │ ← Result
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 📋 Vorschau                              │   │
│ │ Wenn Benutzer öffnet, wird automatisch   │   │
│ │ mit user.firstName aus DataPad gefüllt   │   │
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Features:**
- Connection status badge
- Schema-based dropdown
- Toggle switches
- Test button with results
- Preview explanation

---

### 6. Bulk Edit Panel

```
┌─────────────────────────────────────────────────┐
│ 👥 Massenbearbeitung                       [5]  │ ← Field Count
├─────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ ℹ️  Änderungen werden auf alle Felder    │   │
│ │    angewendet                            │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Feldtyp:                                         │
│ ┌──────────────────────────────────────────┐   │
│ │ Gemischt (verschiedene Typen)            │   │ ← Mixed State
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Pflichtfeld             [Toggle ~]       │   │ ← Indeterminate
│ │ Gemischt                                 │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Schriftgröße:            [Gemischt]             │
│ ┌──────────────────────────────────────────┐   │
│ │ [12] pt                                  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Schreibgeschützt        [Toggle ✓]       │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Änderungen auf alle anwenden             │   │ ← Apply Button
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Ausgewählte Felder:                              │
│ ┌──────────────────────────────────────────┐   │
│ │ • Vorname              [Text]            │   │
│ │ • Nachname             [Text]            │   │
│ │ • Email                [Email]           │   │
│ │ • Telefon              [Text]            │   │
│ │ • PLZ                  [Number]          │   │
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**States:**
- `[Gemischt]` - Properties differ
- `[✓]` - All fields have this value
- `[~]` - Indeterminate state (mixed)

---

## Interaction Patterns

### 1. Panel Animation

```
Closed:                    Opening:                Opened:
                          ┌────────┐              ┌────────┐
                          │        │  →  →  →     │ Panel  │
                          │        │              │ Content│
                          └────────┘              └────────┘
[Hidden]                  [Slide-in]              [Visible]
```

**Animation:**
- Type: Spring
- Duration: 200ms
- Easing: ease-out
- From: `x: 400px, opacity: 0`
- To: `x: 0, opacity: 1`

### 2. Section Collapse

```
Expanded:                 Collapsing:             Collapsed:
┌─────────────┐          ┌─────────────┐         ┌─────────────┐
│ Title   [▼] │          │ Title   [▶] │         │ Title   [▶] │
├─────────────┤          │             │         └─────────────┘
│ Content     │    →     │             │    →
│             │          │             │
└─────────────┘          └─────────────┘
```

**Animation:**
- Duration: 200ms
- Easing: ease-out
- Height: `auto` → `0`
- Opacity: `1` → `0`

### 3. Copy/Paste Flow

```
Step 1: Select Field        Step 2: Copy             Step 3: Select Target
┌────────────┐              ┌────────────┐           ┌────────────┐
│ [Field 1]  │ ← Selected   │ [Field 1]  │           │  Field 1   │
│  Field 2   │              │  Field 2   │           │ [Field 2]  │ ← Target
└────────────┘              └────────────┘           └────────────┘
                                 ↓ Ctrl+C
                            [Clipboard Icon]
                            Properties Copied!

Step 4: Paste                Result:
┌────────────┐              ┌────────────┐
│  Field 1   │              │  Field 1   │
│ [Field 2]  │ → Ctrl+V     │ [Field 2]  │ ← Updated!
└────────────┘              └────────────┘
                            Properties Applied!
```

### 4. Validation Test Flow

```
1. Enter Pattern            2. Enter Test Value       3. Click Test
┌──────────────┐           ┌──────────────┐          ┌──────────────┐
│ ^[A-Z]{2}\d{6}$         │ AB123456     │          │ Testing...   │
└──────────────┘           └──────────────┘          └──────────────┘
                                                              ↓
4. Result (Valid)          4. Result (Invalid)
┌──────────────┐           ┌──────────────┐
│ ✓ Gültig     │           │ ✗ Ungültig   │
└──────────────┘           └──────────────┘
```

---

## Responsive Layouts

### Desktop (>1024px)

```
┌─────────────────────────────────────────────────────────┐
│  Main Content                          │  Properties    │
│                                        │  Panel         │
│  ┌──────────────────────────┐         │  400px wide    │
│  │                          │         │                │
│  │  PDF Viewer              │         │  [Sections]    │
│  │                          │         │                │
│  └──────────────────────────┘         │                │
│                                        │                │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768-1024px)

```
┌─────────────────────────────────────────────────────────┐
│  Main Content                                           │
│  ┌──────────────────────────┐                          │
│  │  PDF Viewer              │                          │
│  └──────────────────────────┘                          │
│                                                          │
│  [Backdrop]                                             │
│  ┌─────────────────────────┐                           │
│  │  Properties Panel       │ ← Overlay                 │
│  │  (Semi-transparent BG)  │                           │
│  └─────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌────────────────────┐
│  Properties Panel  │ ← Full Screen
│                    │
│  [Header]          │
│  ─────────────────│
│                    │
│  [Sections]        │
│                    │
│  [Save] [Cancel]   │
│                    │
└────────────────────┘
```

---

## Color Coding

### Status Colors

```
✅ Success (Green)    ❌ Error (Red)      ⚠️ Warning (Yellow)
┌──────────────┐     ┌──────────────┐    ┌──────────────┐
│ ✓ Valid      │     │ ✗ Invalid    │    │ ⚠ Mixed      │
│ bg-green-100 │     │ bg-red-100   │    │ bg-yellow-100│
└──────────────┘     └──────────────┘    └──────────────┘

ℹ️ Info (Blue)       🎨 Primary          🔘 Secondary
┌──────────────┐     ┌──────────────┐    ┌──────────────┐
│ ℹ Info       │     │ [Button]     │    │ [Button]     │
│ bg-blue-100  │     │ bg-primary   │    │ bg-secondary │
└──────────────┘     └──────────────┘    └──────────────┘
```

### Interactive States

```
Normal              Hover               Active              Disabled
┌──────────┐       ┌──────────┐        ┌──────────┐       ┌──────────┐
│ [Button] │   →   │ [Button] │   →    │ [Button] │       │ [Button] │
│          │       │ + shadow │        │ - 2px    │       │ opacity  │
└──────────┘       └──────────┘        └──────────┘       └──────────┘
border-gray-300    border-primary      border-primary     opacity-50
```

---

## Icon Legend

```
📋 Document/Field       ✓ Validation/Success    🎨 Styling/Appearance
⚡ Behavior/Actions     🔗 Integration/Link     📐 Position/Size
👥 Multi-Select         🔄 Sync/Refresh         ℹ️ Information
⚠️ Warning              ✗ Error/Invalid         📌 Pin/Lock
🔍 Search/Find          ⚙️ Settings             📊 Stats/Data
```

---

## Keyboard Navigation Flow

```
Tab Order:
1. [Header: Pin Button]
   ↓
2. [Header: Close Button]
   ↓
3. [Section 1 Header]
   ↓ (if expanded)
4. [Input 1]
   ↓
5. [Input 2]
   ↓
6. [Section 2 Header]
   ↓
... (continues)
```

---

**Visual Guide Version:** 1.0.0
**Last Updated:** 2025-10-07
**Format:** ASCII Art
