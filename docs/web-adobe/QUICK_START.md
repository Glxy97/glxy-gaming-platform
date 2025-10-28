# Web-Adobe Properties Panel - Quick Start Guide

Los geht's in 5 Minuten mit dem **Advanced Form Field Editor**!

---

## 1. Installation & Setup

### Voraussetzungen
```bash
# Node.js 18+ required
node --version

# Dependencies bereits installiert
npm install
```

### Dev Server starten
```bash
npm run dev
```

Navigate zu: `http://localhost:3000/web-adobe/demo`

---

## 2. Erste Schritte

### Demo öffnen

1. **Dev Server starten**
   ```bash
   npm run dev
   ```

2. **Demo Page öffnen**
   - URL: `http://localhost:3000/web-adobe/demo`
   - Du siehst eine interaktive Demo mit Beispielfeldern

3. **Feld auswählen**
   - Klicke auf ein Feld in der Liste
   - Properties Panel öffnet sich automatisch

4. **Eigenschaften bearbeiten**
   - Ändere Feldname, Typ, Validierung
   - Sieh Live-Preview der Änderungen

---

## 3. Integration in eigene App

### Schritt 1: Components importieren

```tsx
'use client'

import { PropertiesPanel } from '@/components/web-adobe'
import { usePropertiesPanel } from '@/hooks/use-properties-panel'
```

### Schritt 2: Hook nutzen

```tsx
export default function MyEditor() {
  const { setSelectedFields, openPanel } = usePropertiesPanel()

  return (
    <div>
      {/* Dein Editor UI */}
      <PropertiesPanel />
    </div>
  )
}
```

### Schritt 3: Felder auswählen

```tsx
const handleFieldClick = (field: FormField) => {
  setSelectedFields([field])
  openPanel()
}
```

**Das war's!** Properties Panel ist einsatzbereit.

---

## 4. Häufige Use Cases

### Use Case 1: Single Field Edit

```tsx
import { createDefaultField } from '@/lib/web-adobe/field-defaults'

const newField = createDefaultField('text')
setSelectedFields([newField])
```

### Use Case 2: Multi-Select (Bulk Edit)

```tsx
const handleMultiSelect = (fieldIds: string[]) => {
  const selectedFields = fields.filter(f =>
    fieldIds.includes(f.id)
  )
  setSelectedFields(selectedFields)
}
```

### Use Case 3: Copy/Paste Properties

```tsx
const { copyProperties, pasteProperties } = usePropertiesPanel()

// Copy
const handleCopy = (field: FormField) => {
  copyProperties({
    validation: field.validation,
    style: field.style,
  })
  toast.success('Eigenschaften kopiert')
}

// Paste
const handlePaste = (targetField: FormField) => {
  const props = pasteProperties()
  if (props) {
    // Apply to targetField
    updateField(targetField.id, props)
  }
}
```

### Use Case 4: Pin Panel

```tsx
const { setPinned, isPinned } = usePropertiesPanel()

<Button onClick={() => setPinned(!isPinned)}>
  {isPinned ? 'Lösen' : 'Anheften'}
</Button>
```

---

## 5. Keyboard Shortcuts

Produktivität steigern mit Shortcuts:

| Shortcut | Aktion |
|----------|--------|
| `P` | Panel umschalten |
| `ESC` | Panel schließen |
| `Ctrl+S` | Änderungen speichern |
| `Ctrl+C` | Eigenschaften kopieren |
| `Ctrl+V` | Eigenschaften einfügen |
| `Tab` | Nächstes Feld |
| `Shift+Tab` | Vorheriges Feld |

**Tipp:** Shortcuts funktionieren nur, wenn kein Input fokussiert ist!

---

## 6. Validierung hinzufügen

### Preset nutzen (Email, Phone, etc.)

```tsx
import { VALIDATION_PRESETS } from '@/lib/web-adobe/validation-presets'

const emailPattern = VALIDATION_PRESETS.email.pattern
const errorMessage = VALIDATION_PRESETS.email.errorMessage

updateField(field.id, {
  validation: {
    required: true,
    pattern: emailPattern,
    customMessage: errorMessage,
  }
})
```

### Custom Regex

```tsx
updateField(field.id, {
  validation: {
    required: true,
    pattern: '^[A-Z]{2}\\d{6}$',
    customMessage: 'Format: XX123456',
  }
})
```

### Live Testing

Das Properties Panel enthält einen Live-Validator:
1. Öffne Validierung Section
2. Wähle Preset oder Custom
3. Gib Testwert ein
4. Klicke "Test"
5. Sieh Ergebnis (Gültig/Ungültig)

---

## 7. DataPad Integration

### Feld mit DataPad verbinden

```tsx
updateField(field.id, {
  dataPadMapping: {
    mappingKey: 'user.email',
    autoFill: true,
    syncDirection: 'bidirectional',
  }
})
```

### Verfügbare DataPad Keys

Siehe `components/web-adobe/datapad-mapper.tsx`:
- `user.firstName`, `user.lastName`, `user.email`
- `address.street`, `address.city`, `address.zipCode`
- `company.name`, `company.taxId`

### Connection testen

1. Properties Panel öffnen
2. "dataPad Integration" Section
3. Feld auswählen
4. "Verbindung testen" klicken
5. Sieh Mock-Ergebnis

---

## 8. Styling & Theming

### Dark Mode

Properties Panel respektiert `next-themes`:

```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class">
  <App />
</ThemeProvider>
```

### Custom Colors

Überschreibe CSS Variables in `globals.css`:

```css
:root {
  --primary: 217 91% 60%;
  --radius: 0.5rem;
}
```

### Component Variants

Nutze Tailwind Utilities:

```tsx
<PropertiesPanel className="custom-class" />
```

---

## 9. Best Practices

### Performance

✅ **DO:**
- Nutze Zustand Selectors für specific state
- Memoize teure Berechnungen
- Lazy Load Heavy Components

❌ **DON'T:**
- Render gesamtes Panel bei jedem State-Change
- Animate width/height (use transform/opacity)
- Store große Objekte im State

### Accessibility

✅ **DO:**
- Nutze semantische Labels
- Teste mit Keyboard Navigation
- Prüfe Color Contrast

❌ **DON'T:**
- Vergiss aria-labels
- Blockiere Keyboard-Zugang
- Verlasse dich nur auf Farbe

### UX

✅ **DO:**
- Zeige Loading States
- Gib Feedback bei Actions
- Nutze Tooltips für Clarity

❌ **DON'T:**
- Zeige leere States ohne Erklärung
- Verstecke wichtige Actions
- Überlaste User mit Optionen

---

## 10. Troubleshooting

### Problem: Panel öffnet nicht

**Lösung:**
```tsx
// Stelle sicher, dass selectedFields gesetzt ist
setSelectedFields([field]) // field muss valid FormField sein
```

### Problem: Keyboard Shortcuts funktionieren nicht

**Lösung:**
```tsx
// Hook muss in Client Component genutzt werden
'use client' // Am Anfang der Datei

// Kein Input fokussiert (P funktioniert nur ohne Input-Focus)
```

### Problem: Validation funktioniert nicht

**Lösung:**
```tsx
// Pattern muss valid JavaScript Regex sein
// Teste mit testValidationPattern()
import { testValidationPattern } from '@/lib/web-adobe/validation-presets'

const result = testValidationPattern('test', '^[a-z]+$')
console.log(result.isValid) // true
```

### Problem: Framer Motion Animationen ruckeln

**Lösung:**
```tsx
// Nutze transform/opacity, nicht width/height
// Reduziere Animation-Komplexität
// Check Browser DevTools Performance Tab
```

---

## 11. Next Steps

### Erweitere das Panel

1. **Custom Sections hinzufügen**
   ```tsx
   <FieldPropertySection title="Custom" icon={<Icon />}>
     {/* Deine Custom Properties */}
   </FieldPropertySection>
   ```

2. **Neue Field Types**
   ```tsx
   // In types/web-adobe.ts
   export type FieldType = 'text' | 'myCustomType'

   // In lib/web-adobe/field-defaults.ts
   case 'myCustomType':
     return { /* defaults */ }
   ```

3. **Eigene Validation Presets**
   ```tsx
   // In lib/web-adobe/validation-presets.ts
   export const MY_CUSTOM_PRESET = {
     pattern: '^...',
     description: '...',
     example: '...',
     errorMessage: '...',
   }
   ```

### Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e:web-adobe

# Storybook (coming soon)
npm run storybook
```

### Deployment

```bash
# Production Build
npm run build

# Start Production Server
npm run start
```

---

## 12. Resources

### Documentation
- [README.md](../components/web-adobe/README.md) - Full Documentation
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design Guidelines
- [ACCESSIBILITY_AUDIT.md](./ACCESSIBILITY_AUDIT.md) - A11y Report

### Examples
- Demo Page: `/web-adobe/demo`
- Storybook: (coming soon)

### Support
- GitHub Issues
- Discord Community
- Email Support

---

## 13. Cheat Sheet

### Quick Reference

```tsx
// Import
import { PropertiesPanel } from '@/components/web-adobe'
import { usePropertiesPanel } from '@/hooks/use-properties-panel'

// Hook
const {
  isOpen,
  isPinned,
  selectedFields,
  setSelectedFields,
  openPanel,
  closePanel,
  togglePanel,
  copyProperties,
  pasteProperties,
} = usePropertiesPanel()

// Select Field
setSelectedFields([field])

// Multi-Select
setSelectedFields([field1, field2])

// Copy/Paste
copyProperties({ validation: field.validation })
const props = pasteProperties()

// Pin/Unpin
setPinned(true)
```

---

## 14. Video Tutorial

*(Coming Soon)*

- Getting Started (5min)
- Advanced Features (10min)
- Integration Tutorial (15min)

---

**Ready to go?** Öffne `http://localhost:3000/web-adobe/demo` und leg los!

Bei Fragen: Check die [Full Documentation](../components/web-adobe/README.md)

---

**Version:** 1.0.0
**Updated:** 2025-10-07
**Author:** Web-Adobe Team
