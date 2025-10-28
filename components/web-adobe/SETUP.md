# Web-Adobe PDF Viewer - Setup Guide

## 🚀 Schnellstart (5 Minuten)

### 1. PDF.js Worker installieren

Der Worker muss im `public/` Ordner verfügbar sein:

```bash
# Im Projektverzeichnis ausführen:
cd G:/website/verynew/glxy-gaming

# Worker kopieren
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/

# Optional: CMaps für internationale Schriften
mkdir -p public/cmaps
cp -r node_modules/pdfjs-dist/cmaps/* public/cmaps/

# Optional: Standard Fonts
mkdir -p public/standard_fonts
cp -r node_modules/pdfjs-dist/standard_fonts/* public/standard_fonts/
```

**Windows PowerShell Alternative:**
```powershell
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.js" -Destination "public\"
Copy-Item "node_modules\pdfjs-dist\cmaps" -Destination "public\" -Recurse
Copy-Item "node_modules\pdfjs-dist\standard_fonts" -Destination "public\" -Recurse
```

### 2. Verifikation

Prüfe ob die Dateien existieren:

```bash
ls -la public/pdf.worker.min.js
ls -la public/cmaps/
ls -la public/standard_fonts/
```

### 3. Erste Verwendung

Erstelle eine Test-Seite:

**`app/test-pdf/page.tsx`:**
```tsx
import { PdfViewer } from '@/components/web-adobe/pdf-viewer'

export default function TestPdfPage() {
  return (
    <main className="h-screen">
      <PdfViewer
        documentUrl="/sample-form.pdf"
        showToolbar={true}
        showFieldOverlay={true}
        onDocumentLoad={(doc) => {
          console.log('✅ PDF geladen!')
          console.log(`📄 Seiten: ${doc.totalPages}`)
          console.log(`📝 Felder: ${doc.fields.length}`)
        }}
        onError={(error) => {
          console.error('❌ Fehler:', error.message)
        }}
      />
    </main>
  )
}
```

### 4. Test-PDF vorbereiten

Lade ein PDF mit Formularfeldern in `public/sample-form.pdf` hoch.

**Keine Test-PDF zur Hand?**
- [Download Sample PDF](https://www.irs.gov/pub/irs-pdf/fw4.pdf) (IRS Form W-4)
- Oder erstelle eins mit Adobe Acrobat/LibreOffice

### 5. Dev-Server starten

```bash
npm run dev
```

Öffne: `http://localhost:3000/test-pdf`

---

## ✅ Checkliste: Installation erfolgreich?

- [ ] `public/pdf.worker.min.js` existiert
- [ ] Keine Console-Errors beim Laden
- [ ] PDF wird angezeigt
- [ ] Formularfelder werden als Overlays gerendert
- [ ] Zoom-Controls funktionieren
- [ ] Rechtsklick-Menü erscheint auf Feldern

---

## 🔧 Troubleshooting

### Problem 1: "Setting up fake worker failed"

**Lösung:**
```bash
# Worker erneut kopieren
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/

# Hard-Refresh im Browser: Ctrl+Shift+R
```

### Problem 2: PDF lädt nicht

**Prüfe:**
1. Ist die PDF-URL korrekt? (`/sample.pdf` → `public/sample.pdf`)
2. Console-Errors prüfen (F12 → Console)
3. Network-Tab prüfen (HTTP 404?)

**Debug:**
```tsx
<PdfViewer
  documentUrl="/sample.pdf"
  onError={(error) => {
    alert(`Fehler: ${error.message}`)
  }}
/>
```

### Problem 3: Keine Formularfelder sichtbar

**Mögliche Ursachen:**
1. PDF hat keine Formularfelder (in Acrobat prüfen)
2. Overlay ist ausgeblendet (Ctrl+O drücken)
3. Zoom zu niedrig (Felder zu klein)

**Test:**
```tsx
const viewer = usePdfViewer('/sample.pdf')

useEffect(() => {
  if (viewer.document) {
    console.log('Felder:', viewer.fields)
  }
}, [viewer.document])
```

### Problem 4: Performance-Probleme

**Optimierungen:**
1. Reduziere initiales Zoom: `initialZoom={0.75}`
2. Aktiviere Virtualisierung (TODO: noch nicht implementiert)
3. Nutze kleinere PDFs für Development

---

## 📦 Projektstruktur

Nach dem Setup sollte dein Projekt so aussehen:

```
glxy-gaming/
├── public/
│   ├── pdf.worker.min.js           ← Wichtig!
│   ├── cmaps/                      ← Optional
│   ├── standard_fonts/             ← Optional
│   └── sample-form.pdf             ← Test-PDF
│
├── components/web-adobe/
│   ├── pdf-viewer.tsx              ← Haupt-Component
│   ├── field-overlay.tsx           ← Overlays
│   ├── viewer-controls.tsx         ← Toolbar
│   ├── context-menu.tsx            ← Rechtsklick-Menü
│   ├── README.md                   ← Doku
│   └── SETUP.md                    ← Diese Datei
│
├── lib/web-adobe/
│   ├── pdf-renderer.ts             ← Rendering-Engine
│   └── pdf-field-parser.ts         ← Feld-Extraktion
│
├── lib/stores/
│   └── pdf-viewer-store.ts         ← State Management
│
├── hooks/
│   └── use-pdf-viewer.ts           ← Custom Hook
│
└── types/
    └── pdf-viewer.ts               ← TypeScript Types
```

---

## 🎯 Nächste Schritte

### 1. Integration in bestehende App

**Beispiel: Dashboard-Integration**

```tsx
// app/dashboard/pdf-editor/page.tsx
import { PdfViewer } from '@/components/web-adobe/pdf-viewer'
import { Card } from '@/components/ui/card'

export default function PdfEditorPage() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen">
      {/* Sidebar: PDF-Liste */}
      <Card className="p-4">
        <h2>Meine PDFs</h2>
        <ul>
          <li onClick={() => setSelectedPdf('/doc1.pdf')}>Dokument 1</li>
          <li onClick={() => setSelectedPdf('/doc2.pdf')}>Dokument 2</li>
        </ul>
      </Card>

      {/* Main: PDF Viewer */}
      <div className="h-screen">
        {selectedPdf ? (
          <PdfViewer documentUrl={selectedPdf} />
        ) : (
          <div>Kein PDF ausgewählt</div>
        )}
      </div>
    </div>
  )
}
```

### 2. Bidirektionale Sync mit Tabelle

**Beispiel: Formular-Editor mit Tabelle**

```tsx
import { usePdfViewer } from '@/hooks/use-pdf-viewer'
import { PdfViewer } from '@/components/web-adobe/pdf-viewer'
import { DataTable } from '@/components/ui/data-table'

export default function FormEditorPage() {
  const viewer = usePdfViewer('/form.pdf')

  // Tabellen-Columns
  const columns = [
    { header: 'Feldname', accessorKey: 'displayName' },
    { header: 'Typ', accessorKey: 'type' },
    {
      header: 'Wert',
      accessorKey: 'value',
      cell: ({ row }) => (
        <input
          value={row.original.value || ''}
          onChange={(e) => {
            viewer.updateFieldValue(row.original.id, e.target.value)
          }}
        />
      )
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 h-screen">
      {/* Left: PDF Viewer */}
      <PdfViewer documentUrl="/form.pdf" />

      {/* Right: Tabelle */}
      <div className="overflow-auto">
        <DataTable
          columns={columns}
          data={viewer.fields}
        />
      </div>
    </div>
  )
}
```

### 3. Export/Import implementieren

```tsx
import { exportFieldsToJson, importFieldsFromJson } from '@/lib/web-adobe/pdf-field-parser'

function ExportButton() {
  const viewer = usePdfViewer('/form.pdf')

  const handleExport = () => {
    const json = exportFieldsToJson(viewer.fields, 'form.pdf')
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'form-fields.json'
    a.click()
  }

  return <button onClick={handleExport}>Export JSON</button>
}
```

---

## 🔐 Production-Checklist

Vor dem Deployment prüfen:

- [ ] **Worker-Dateien** in `public/` committed (Git LFS für große Dateien?)
- [ ] **Error-Handling** für alle PDF-Ladevorgänge
- [ ] **Loading-States** für bessere UX
- [ ] **Sentry/Monitoring** für PDF-Fehler einrichten
- [ ] **Performance-Tests** mit großen PDFs (50+ Seiten)
- [ ] **Browser-Kompatibilität** testen (Chrome, Firefox, Safari, Edge)
- [ ] **Mobile-Optimierung** (falls relevant)
- [ ] **Accessibility** mit Screen-Reader testen

---

## 📚 Weitere Ressourcen

- **PDF.js Docs:** https://mozilla.github.io/pdf.js/
- **Zustand Docs:** https://zustand-demo.pmnd.rs/
- **Next.js Docs:** https://nextjs.org/docs
- **Projektspezifische README:** `README.md` im selben Ordner

---

## 🆘 Support

Bei Problemen:
1. Prüfe Console-Logs (F12)
2. Siehe `README.md` für API-Referenz
3. Prüfe `types/pdf-viewer.ts` für TypeScript-Typen
4. Kontaktiere Team-Lead

**Happy Coding! 🚀**
