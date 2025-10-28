# Properties Panel - Deutsche Dokumentation

## Übersicht

Das **Properties Panel** ist das zentrale Interface zur Bearbeitung von PDF-Formularfeld-Eigenschaften in Web-Adobe. Es bietet eine vollständig deutsche Benutzeroberfläche mit intuitiven Eingabemöglichkeiten und erweiterten Funktionen.

## Komponenten-Architektur

### Hauptkomponenten

```
components/web-adobe/
├── properties-panel.tsx          # Haupt-Panel mit Slide-In Animation
├── field-property-section.tsx    # Collapsible Sections
├── field-type-select.tsx         # Feldtyp-Auswahl mit Icons
├── validation-builder.tsx        # Validierungs-Editor
├── position-editor.tsx           # Position & Größen-Editor
├── datapad-mapper.tsx           # dataPad-Integration
└── bulk-edit-panel.tsx          # Multi-Edit Mode
```

### Unterstützende Module

```
lib/web-adobe/
├── de-labels.ts                 # Deutsche Labels & Tooltips
└── validation-presets.ts        # Validierungsregeln
```

## Features

### 1. Panel-Steuerung

#### Öffnen/Schließen
- **Keyboard**: `P` - Toggle Panel
- **Mouse**: Click auf Feld öffnet Panel automatisch
- **Pin**: Panel anheften, um es geöffnet zu lassen

#### States
```typescript
interface PropertiesPanelState {
  isOpen: boolean           // Panel sichtbar?
  isPinned: boolean         // Angeheftet?
  selectedFieldId: string   // Aktuelles Feld
  hasUnsavedChanges: boolean // Ungespeicherte Änderungen?
}
```

### 2. Basis-Eigenschaften

#### Feldname
- **Technischer Name**: Nur Buchstaben, Zahlen, Unterstriche
- **Validation**: Automatische Prüfung auf Gültigkeit
- **Auto-Suggest**: Vorschläge basierend auf Feldtyp

```typescript
// Beispiele
fieldName: "kundenname_vorname"
fieldName: "email_adresse"
fieldName: "geburtsdatum"
```

#### Anzeigename
- **Benutzerfreundlich**: Wird in dataPad angezeigt
- **Unterstützt Umlaute**: Vollständige deutsche Zeichen
- **Optional**: Fallback auf Feldname

```typescript
displayName: "Vorname des Kunden"
displayName: "E-Mail-Adresse"
displayName: "Geburtsdatum"
```

#### Feldtyp
- **10 Typen**: Text, Textarea, Number, Email, Phone, Date, Checkbox, Radio, Dropdown, Signature
- **Mit Icons**: Visuelle Unterscheidung
- **Gruppiert**: Nach Kategorie (Eingabe, Auswahl, Spezial)

### 3. Validierung

#### Standard-Presets

| Preset | Pattern | Beispiel |
|--------|---------|----------|
| E-Mail | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | max.mustermann@beispiel.de |
| Telefon | `^(\+49\|0)[1-9]\d{1,14}$` | +49 171 1234567 |
| PLZ | `^\d{5}$` | 12345 |
| IBAN | `^DE\d{20}$` | DE89370400440532013000 |
| Datum | `^(0[1-9]\|[12]\d\|3[01])\.(0[1-9]\|1[0-2])\.(19\|20)\d{2}$` | 31.12.2024 |
| URL | `^https?://...` | https://www.beispiel.de |
| Name | `^[A-Za-zäöüÄÖÜß\s\-]{2,50}$` | Max Müller-Schmidt |
| Steuer-ID | `^\d{11}$` | 12345678901 |
| Uhrzeit | `^([01]\d\|2[0-3]):([0-5]\d)$` | 14:30 |

#### Live-Testing
```typescript
// Testen der Validierung
testValue: "AB123456"
pattern: "^[A-Z]{2}\d{6}$"
result: ✅ Gültig

testValue: "abc123"
pattern: "^[A-Z]{2}\d{6}$"
result: ❌ Ungültig - Bitte Format XX123456 eingeben
```

#### Custom Regex
- **Visual Editor**: Tabs für Standard + Custom
- **Error Messages**: Benutzerdefinierte Fehlermeldungen
- **Pattern Validation**: Prüfung auf gültige Regex

### 4. Darstellung

#### Schrift
```typescript
fontSize: 8-72 pt         // Schriftgröße
fontColor: "#000000"      // Textfarbe (Color Picker)
fontFamily: "Helvetica"   // Schriftart
alignment: "left"         // Links, Mitte, Rechts
```

#### Rahmen
```typescript
border: "solid"           // Durchgezogen, Gestrichelt, Gepunktet
borderWidth: 1-5 px       // Rahmenbreite
borderColor: "#000000"    // Rahmenfarbe
```

#### Hintergrund
```typescript
background: "transparent" // Transparent, Weiß, Grau, Custom
backgroundColor: "#FFFFFF"
```

### 5. Position & Größe

#### Position
- **X-Position**: Horizontal (von links)
- **Y-Position**: Vertikal (von oben)
- **Einheit**: Pixel
- **Increment/Decrement**: +/- Buttons

#### Größe
- **Breite**: 10-600 px
- **Höhe**: 10-800 px
- **Proportionen**: Lock-Ratio Option

#### Raster
- **Snap to Grid**: Automatisches Ausrichten
- **Grid Size**: 5-50 px einstellbar
- **Visual Preview**: Mini-Vorschau mit Raster

#### Ausrichtung
- **Horizontal**: Links, Mitte, Rechts
- **Vertikal**: Oben, Mitte, Unten
- **Verteilen**: Gleichmäßige Abstände

### 6. Verhalten

#### Toggles
```typescript
readonly: boolean     // Schreibgeschützt
hidden: boolean       // Ausgeblendet
multiline: boolean    // Mehrere Zeilen (Textarea)
disabled: boolean     // Deaktiviert
autoFocus: boolean    // Auto-Fokus
```

#### Conditional Logic
```typescript
// Zukünftig: Bedingte Anzeige
showIf: {
  field: "other_field_id",
  condition: "equals",
  value: "ja"
}
```

### 7. dataPad-Integration

#### Mapping
- **15+ Vorschläge**: Kategorisiert nach Kunde, Adresse, Bestellung, Benutzer
- **Auto-Complete**: Intelligente Vorschläge basierend auf Feldname
- **Bi-Directional Sync**: PDF ↔ dataPad

#### Kategorien
```typescript
Kunde:
  - customer.firstName     → Kundenname (Vorname)
  - customer.lastName      → Kundenname (Nachname)
  - customer.email         → E-Mail-Adresse
  - customer.phone         → Telefonnummer

Adresse:
  - address.street         → Straße
  - address.postalCode     → Postleitzahl
  - address.city           → Stadt
  - address.country        → Land

Bestellung:
  - order.number           → Bestellnummer
  - order.date             → Bestelldatum
  - order.total            → Gesamtbetrag
```

#### Auto-Fill
- **Aktivieren/Deaktivieren**: Toggle Switch
- **Sync Direction**:
  - PDF → dataPad
  - dataPad → PDF
  - Bidirektional ⇄

#### Testing
- **Verbindung testen**: Button mit Spinner
- **Preview**: Beispielwert aus dataPad
- **Status**: Verbunden/Nicht verbunden Badge

### 8. Bulk-Edit (Multi-Select)

#### Aktivierung
- **Mehrere Felder auswählen**: Strg + Click
- **Automatisches Öffnen**: Panel zeigt Bulk-Mode

#### Gemeinsame Eigenschaften
```typescript
// Nur gemeinsame Properties werden angezeigt
commonProperties: {
  fontSize: 12 | "Gemischt"
  required: true | "Gemischt"
  readonly: false | "Gemischt"
}
```

#### Änderungen Anwenden
- **Apply Button**: Änderungen auf alle Felder
- **Feldliste**: Übersicht ausgewählter Felder
- **Warning Banner**: Info über Massenbearbeitung

## Keyboard Shortcuts

| Shortcut | Aktion | Beschreibung |
|----------|--------|--------------|
| `P` | Toggle Panel | Eigenschaften ein/aus |
| `Strg+S` | Speichern | Änderungen speichern |
| `Strg+Enter` | Speichern & Schließen | Save and Close |
| `Escape` | Abbrechen | Ohne Speichern schließen |
| `Tab` | Nächstes Feld | Zu nächstem Input |
| `Strg+C` | Kopieren | Eigenschaften kopieren |
| `Strg+V` | Einfügen | Eigenschaften einfügen |

## Auto-Save

### Funktionsweise
```typescript
// Auto-Save nach 3 Sekunden Inaktivität
const AUTO_SAVE_DELAY = 3000

useEffect(() => {
  if (!hasUnsavedChanges) return

  const timer = setTimeout(() => {
    saveProperties()
    toast.success('Automatisch gespeichert')
  }, AUTO_SAVE_DELAY)

  return () => clearTimeout(timer)
}, [hasUnsavedChanges])
```

### Indicator
```typescript
// Last Saved Timestamp
<span className="text-xs text-muted-foreground">
  Automatisch gespeichert um {timestamp}
</span>
```

## Toast-Notifications

### Messages
```typescript
// Success
toast.success('Eigenschaften gespeichert')
toast.success('Änderungen übernommen')

// Warning
toast.warning('Sie haben ungespeicherte Änderungen')

// Error
toast.error('Speichern fehlgeschlagen')
toast.error('Ungültiger Feldname')
```

## Animationen

### Panel Slide-In
```typescript
<motion.div
  initial={{ x: 400, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 400, opacity: 0 }}
  transition={{
    type: 'spring',
    damping: 25,
    stiffness: 200
  }}
>
```

### Section Accordion
```typescript
<CollapsibleContent className="animate-accordion-down">
  {/* Content */}
</CollapsibleContent>
```

## Responsive Design

### Breakpoints
```typescript
// Mobile: Full width
className="w-full"

// Desktop: 400px width
className="sm:w-[400px]"

// Backdrop: Nur mobile
className="lg:hidden"
```

## Accessibility

### ARIA Labels
```typescript
// Alle auf Deutsch!
aria-label="Eigenschaften-Panel"
aria-label="Feldname eingeben"
aria-label="Validierung aktivieren"
aria-describedby="field-name-help"
```

### Focus Management
- **Auto-Focus**: Erstes Input bei Panel-Öffnung
- **Tab Order**: Logische Reihenfolge
- **Keyboard Navigation**: Vollständig navigierbar

### Screen Reader Support
```typescript
<span className="sr-only">
  Pflichtfeld - Muss ausgefüllt werden
</span>
```

## Best Practices

### Feldnamen
✅ **Gut**:
- `kundenname_vorname`
- `email_adresse`
- `geburtsdatum`

❌ **Schlecht**:
- `Kundenname Vorname` (Leerzeichen)
- `email-adresse` (Bindestrich)
- `Vorname` (zu generisch)

### Validierung
✅ **Gut**:
- Preset verwenden wenn möglich
- Klare Fehlermeldungen
- Live-Testing vor Speichern

❌ **Schlecht**:
- Zu komplexe Custom Regex
- Unklare Fehlermeldungen
- Keine Testdaten

### dataPad Mapping
✅ **Gut**:
- Konsistente Namenskonventionen
- Kategorien nutzen
- Bidirektionale Sync

❌ **Schlecht**:
- Inkonsistente Keys
- Keine Dokumentation
- One-way Sync ohne Grund

## Troubleshooting

### Panel öffnet nicht
1. Prüfen ob Feld ausgewählt ist
2. Keyboard Shortcut `P` versuchen
3. Console auf Errors prüfen

### Validierung funktioniert nicht
1. Regex in Live-Test prüfen
2. Escaping beachten (`\d` → `\\d`)
3. Pattern-Presets verwenden

### dataPad Mapping zeigt keine Daten
1. Mapping Key prüfen
2. "Verbindung testen" Button
3. Auto-Fill aktiviert?
4. Sync Direction richtig?

## Erweiterungen

### Zukünftige Features
- [ ] Conditional Logic
- [ ] Field Dependencies
- [ ] Custom Presets speichern
- [ ] Undo/Redo History
- [ ] Field Templates
- [ ] Bulk Import/Export
- [ ] Advanced Styling (Shadows, Borders)
- [ ] Custom Fonts Upload

## Code-Beispiele

### Panel öffnen (programmatisch)
```typescript
const { openPanel } = usePropertiesPanel()

openPanel(fieldId, {
  fieldName: 'customer_email',
  displayName: 'E-Mail-Adresse',
  fieldType: 'email',
  // ... weitere Properties
})
```

### Bulk Edit aktivieren
```typescript
const { openBulkEdit } = usePropertiesPanel()

openBulkEdit(['field1', 'field2', 'field3'], {
  fontSize: 12,
  required: true
})
```

### Properties aktualisieren
```typescript
const { updateProperty } = usePropertiesPanel()

updateProperty('fontSize', 14)
updateProperty('required', true)
```

### Custom Validation
```typescript
const customValidation = {
  pattern: '^KD\\d{8}$',
  errorMessage: 'Kundennummer muss Format KD12345678 haben'
}

updateProperty('validation', customValidation)
```

## Support

Bei Fragen oder Problemen:
- **Dokumentation**: `/docs/web-adobe/`
- **Code**: `components/web-adobe/`
- **Labels**: `lib/web-adobe/de-labels.ts`

---

**Vollständig deutsche UI/UX** 🇩🇪
**Built with Next.js 15, React 19, Tailwind CSS, Framer Motion**
