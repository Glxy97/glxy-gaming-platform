# Web-Adobe PDF Viewer - Code Examples

## 📚 Praxisbeispiele für häufige Use-Cases

---

## 1. Basic PDF Viewer

Einfachster Einstieg - PDF anzeigen mit allen Features:

```tsx
'use client'

import { PdfViewer } from '@/components/web-adobe'

export default function BasicExample() {
  return (
    <div className="h-screen">
      <PdfViewer
        documentUrl="/documents/sample-form.pdf"
        showToolbar={true}
        showFieldOverlay={true}
      />
    </div>
  )
}
```

---

## 2. PDF mit Event-Handling

Reagiere auf Dokument-Events und Feld-Interaktionen:

```tsx
'use client'

import { PdfViewer } from '@/components/web-adobe'
import type { PdfDocument, FormField } from '@/components/web-adobe'
import { useState } from 'react'

export default function EventHandlingExample() {
  const [status, setStatus] = useState('')

  return (
    <>
      <div className="p-4 bg-gray-100">
        Status: {status}
      </div>

      <PdfViewer
        documentUrl="/documents/form.pdf"
        onDocumentLoad={(doc: PdfDocument) => {
          setStatus(`✅ Geladen: ${doc.fileName} (${doc.fields.length} Felder)`)
        }}
        onFieldClick={(field: FormField) => {
          setStatus(`📝 Feld angeklickt: ${field.displayName}`)
        }}
        onError={(error) => {
          setStatus(`❌ Fehler: ${error.message}`)
        }}
      />
    </>
  )
}
```

---

## 3. Bidirektionale Sync mit Tabelle

PDF-Viewer links, Feld-Tabelle rechts - vollständige Synchronisation:

```tsx
'use client'

import { usePdfViewer } from '@/components/web-adobe'
import { PdfViewer } from '@/components/web-adobe'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function BidirectionalSyncExample() {
  const viewer = usePdfViewer('/documents/form.pdf', {
    enableShortcuts: true,
  })

  return (
    <div className="grid grid-cols-2 gap-4 h-screen">
      {/* Left: PDF Viewer */}
      <div className="border-r">
        <PdfViewer documentUrl="/documents/form.pdf" />
      </div>

      {/* Right: Field Table */}
      <div className="overflow-auto p-4">
        <h2 className="text-xl font-bold mb-4">Formularfelder</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feldname</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Wert</TableHead>
              <TableHead>Seite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewer.fields.map((field) => (
              <TableRow
                key={field.id}
                className={
                  viewer.selectedFieldIds.includes(field.id)
                    ? 'bg-blue-100'
                    : ''
                }
              >
                <TableCell>{field.displayName}</TableCell>
                <TableCell>{field.type}</TableCell>
                <TableCell>
                  <Input
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      viewer.updateFieldValue(field.id, e.target.value)
                    }}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>{field.page}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

---

## 4. Custom Toolbar

Eigene Controls hinzufügen:

```tsx
'use client'

import { usePdfViewer, PdfViewer } from '@/components/web-adobe'
import { Button } from '@/components/ui/button'
import { Download, Upload, Save } from 'lucide-react'

export default function CustomToolbarExample() {
  const viewer = usePdfViewer('/documents/form.pdf')

  const handleSave = () => {
    // TODO: Implement PDF save
    console.log('Saving...', viewer.fields)
  }

  const handleExport = () => {
    const json = JSON.stringify(viewer.fields, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'fields.json'
    a.click()
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Custom Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-gray-100 border-b">
        <h1 className="text-lg font-bold mr-4">PDF Editor</h1>

        <Button onClick={handleSave} variant="default">
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>

        <div className="flex-1" />

        <span className="text-sm text-muted-foreground">
          {viewer.fields.length} Felder | Seite {viewer.currentPage}/{viewer.totalPages}
        </span>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1">
        <PdfViewer
          documentUrl="/documents/form.pdf"
          showToolbar={true} // Standardtoolbar bleibt
        />
      </div>
    </div>
  )
}
```

---

## 5. Field Filtering & Search

Felder filtern nach Typ oder Name:

```tsx
'use client'

import { usePdfViewer } from '@/components/web-adobe'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function FieldFilteringExample() {
  const viewer = usePdfViewer('/documents/form.pdf')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Gefilterte Felder
  const filteredFields = useMemo(() => {
    return viewer.fields.filter((field) => {
      // Filter nach Typ
      if (filterType !== 'all' && field.type !== filterType) {
        return false
      }

      // Filter nach Name
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          field.displayName.toLowerCase().includes(search) ||
          field.name.toLowerCase().includes(search)
        )
      }

      return true
    })
  }, [viewer.fields, searchTerm, filterType])

  return (
    <div className="p-4">
      {/* Filter Controls */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Feld suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="radio">Radio</SelectItem>
            <SelectItem value="dropdown">Dropdown</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          {filteredFields.length} von {viewer.fields.length} Feldern
        </div>
      </div>

      {/* Field List */}
      <div className="space-y-2">
        {filteredFields.map((field) => (
          <div
            key={field.id}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => {
              viewer.selectField(field.id)
              viewer.setPage(field.page)
            }}
          >
            <div className="font-medium">{field.displayName}</div>
            <div className="text-sm text-muted-foreground">
              {field.type} • Seite {field.page}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Bulk-Edit für Multiple Felder

Mehrere Felder gleichzeitig bearbeiten:

```tsx
'use client'

import { usePdfViewer } from '@/components/web-adobe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function BulkEditExample() {
  const viewer = usePdfViewer('/documents/form.pdf')
  const [bulkValue, setBulkValue] = useState('')

  const selectedFields = viewer.getSelectedFields()

  const handleBulkUpdate = () => {
    if (selectedFields.length === 0) {
      alert('Keine Felder ausgewählt!')
      return
    }

    // Batch-Update
    viewer.batchUpdateFields(
      selectedFields.map((field) => ({
        id: field.id,
        updates: { value: bulkValue },
      }))
    )

    setBulkValue('')
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Bulk-Edit</h2>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          {selectedFields.length} Feld(er) ausgewählt
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Wert für alle..."
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
          />

          <Button onClick={handleBulkUpdate} disabled={selectedFields.length === 0}>
            Alle aktualisieren
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Ausgewählte Felder:</h3>
        {selectedFields.map((field) => (
          <div key={field.id} className="p-2 bg-gray-100 rounded text-sm">
            {field.displayName} = "{field.value}"
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 7. Field Statistics Dashboard

Übersicht über Formularfelder:

```tsx
'use client'

import { usePdfViewer } from '@/components/web-adobe'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Type, Circle, ChevronDown } from 'lucide-react'

export default function StatisticsExample() {
  const viewer = usePdfViewer('/documents/form.pdf')

  const stats = {
    total: viewer.fields.length,
    text: viewer.fields.filter((f) => f.type === 'text').length,
    checkbox: viewer.fields.filter((f) => f.type === 'checkbox').length,
    radio: viewer.fields.filter((f) => f.type === 'radio').length,
    dropdown: viewer.fields.filter((f) => f.type === 'dropdown').length,
    required: viewer.fields.filter((f) => f.required).length,
    filled: viewer.fields.filter((f) => f.value).length,
    empty: viewer.fields.filter((f) => !f.value).length,
  }

  const fillPercentage = stats.total > 0
    ? Math.round((stats.filled / stats.total) * 100)
    : 0

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Formular-Statistiken</h2>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Type className="h-4 w-4" />
              Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.text}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              Checkboxen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.checkbox}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Ausgefüllt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {fillPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.filled} von {stats.total}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fortschritt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ausgefüllt:</span>
              <span className="font-medium">{stats.filled}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Leer:</span>
              <span className="font-medium">{stats.empty}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pflichtfelder:</span>
              <span className="font-medium text-red-600">{stats.required}</span>
            </div>
          </div>

          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 8. PDF Upload mit Drag & Drop

Benutzer kann PDFs hochladen:

```tsx
'use client'

import { usePdfViewer, PdfViewer } from '@/components/web-adobe'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

export default function UploadExample() {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setPdfBlob(file)
    } else {
      alert('Bitte nur PDF-Dateien hochladen!')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  })

  if (!pdfBlob) {
    return (
      <div
        {...getRootProps()}
        className="flex items-center justify-center h-screen border-4 border-dashed rounded-lg cursor-pointer"
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-medium">
            {isDragActive
              ? 'PDF hier ablegen...'
              : 'PDF hierher ziehen oder klicken'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Nur PDF-Dateien erlaubt
          </p>
        </div>
      </div>
    )
  }

  return <PdfViewer documentUrl={pdfBlob} />
}
```

---

## 9. Keyboard Shortcuts Custom Handler

Eigene Shortcuts definieren:

```tsx
'use client'

import { PdfViewer } from '@/components/web-adobe'
import { useEffect } from 'react'

export default function CustomShortcutsExample() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Custom Shortcut: Ctrl+K für Command Palette
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        console.log('Command Palette öffnen...')
      }

      // Custom: Ctrl+M für Mapping
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        console.log('dataPad Mapper öffnen...')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <PdfViewer documentUrl="/documents/form.pdf" />
}
```

---

## 10. Responsive Layout (Mobile-optimiert)

PDF-Viewer für verschiedene Bildschirmgrößen:

```tsx
'use client'

import { PdfViewer } from '@/components/web-adobe'

export default function ResponsiveExample() {
  return (
    <div className="h-screen">
      <PdfViewer
        documentUrl="/documents/form.pdf"
        showToolbar={true}
        // Kleinerer initialer Zoom auf Mobile
        initialZoom={0.5}
        className="responsive-pdf-viewer"
      />

      <style jsx global>{`
        @media (max-width: 768px) {
          .responsive-pdf-viewer {
            /* Mobile-Optimierungen */
          }
        }
      `}</style>
    </div>
  )
}
```

---

## 🚀 Weitere Ressourcen

- **README.md** - Vollständige Dokumentation
- **SETUP.md** - Installation & Troubleshooting
- **SHORTCUTS.md** - Keyboard Shortcuts Referenz
- **Types** - `types/pdf-viewer.ts` für TypeScript API

**Viel Erfolg beim Entwickeln! 🎉**
