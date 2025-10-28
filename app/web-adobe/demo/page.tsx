/**
 * Web-Adobe Demo Page
 * Interactive demo of the Properties Panel
 */

'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PropertiesPanel } from '@/components/web-adobe/properties-panel'
import { usePropertiesPanel } from '@/hooks/use-properties-panel'
import { createDefaultField, FIELD_TYPE_ICONS } from '@/lib/web-adobe/field-defaults'
import { FormField } from '@/types/web-adobe'
import { cn } from '@/lib/utils'

type FieldType = 'text' | 'email' | 'number' | 'checkbox' | 'dropdown'

const DEMO_FIELD_TYPES: FieldType[] = ['text', 'email', 'number', 'checkbox', 'dropdown']

export default function WebAdobeDemoPage() {
  const [fields, setFields] = useState<FormField[]>([
    createDefaultField('text'),
    createDefaultField('email'),
  ])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const { openPanel } = usePropertiesPanel()

  const handleSelectField = (field: FormField) => {
    setSelectedFieldId(field.id)
    // Note: This demo uses a different FormField type (web-adobe) than the Properties Panel expects (pdf-viewer)
    // In production, you would convert between types using field-mapper utilities
    openPanel()
  }

  const handleAddField = (type: FieldType) => {
    const newField = createDefaultField(type)
    setFields((prev) => [...prev, newField])
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Web-Adobe Properties Panel</h1>
              <p className="text-muted-foreground">
                Interaktive Demo des Advanced Form Field Editors
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/20">
          <h3 className="text-sm font-semibold mb-2">Anleitung</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Klicken Sie auf ein Feld unten, um das Properties Panel zu öffnen</li>
            <li>Verwenden Sie <kbd className="px-2 py-0.5 text-xs bg-muted rounded">P</kbd> zum Umschalten des Panels</li>
            <li>Drücken Sie <kbd className="px-2 py-0.5 text-xs bg-muted rounded">ESC</kbd> zum Schließen</li>
            <li>Nutzen Sie Multi-Select (Strg+Click) für Massenbearbeitung</li>
          </ul>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Field List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Formularfelder</h2>
              <Badge variant="secondary" className="font-mono">
                {fields.length} {fields.length === 1 ? 'Feld' : 'Felder'}
              </Badge>
            </div>

            {/* Add Field Buttons */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Feld hinzufügen</h3>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_FIELD_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField(type)}
                    className="justify-start"
                  >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    <span className="mr-1">{FIELD_TYPE_ICONS[type]}</span>
                    {type}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Field List */}
            <div className="space-y-2">
              {fields.map((field) => (
                <Card
                  key={field.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:shadow-md',
                    selectedFieldId === field.id &&
                      'ring-2 ring-primary bg-primary/5'
                  )}
                  onClick={() => handleSelectField(field)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{FIELD_TYPE_ICONS[field.type]}</span>
                        <span className="font-semibold">
                          {field.displayName || field.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.validation.required && (
                          <Badge variant="destructive" className="text-xs">
                            Pflichtfeld
                          </Badge>
                        )}
                        {field.behavior.readOnly && (
                          <Badge variant="secondary" className="text-xs">
                            Schreibgeschützt
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Field Preview */}
                  <div className="mt-3 p-2 rounded bg-muted/30 text-xs font-mono">
                    ID: {field.id} | Type: {field.type}
                  </div>
                </Card>
              ))}

              {fields.length === 0 && (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Keine Felder vorhanden. Fügen Sie ein Feld hinzu, um zu beginnen.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorschau</h2>

            <Card className="p-6 min-h-[400px]">
              {selectedField ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{FIELD_TYPE_ICONS[selectedField.type]}</span>
                      <div>
                        <h3 className="font-semibold">
                          {selectedField.displayName || selectedField.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Typ: {selectedField.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Feldname:</span>
                      <code className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                        {selectedField.name}
                      </code>
                    </div>

                    <div>
                      <span className="font-medium">Position:</span>
                      <span className="ml-2 text-sm">
                        Seite {selectedField.position.page}, X:{selectedField.position.x} Y:{selectedField.position.y}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">Pflichtfeld:</span>
                      <span className="ml-2">{selectedField.validation.required ? 'Ja' : 'Nein'}</span>
                    </div>

                    <div>
                      <span className="font-medium">Nur Lesen:</span>
                      <span className="ml-2">{selectedField.behavior.readOnly ? 'Ja' : 'Nein'}</span>
                    </div>

                    <div>
                      <span className="font-medium">Validierung:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedField.validation.required ? (
                          <Badge variant="destructive" className="text-xs">
                            Pflichtfeld
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                        {selectedField.validation.pattern && (
                          <Badge variant="outline" className="text-xs">
                            Mit Validierung: {selectedField.validation.pattern}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Klicken Sie auf "Eigenschaften bearbeiten" oder drücken Sie{' '}
                      <kbd className="px-2 py-0.5 text-xs bg-muted rounded">P</kbd>{' '}
                      um das Properties Panel zu öffnen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-sm font-semibold mb-1">
                    Kein Feld ausgewählt
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Wählen Sie ein Feld aus der Liste links, um dessen Eigenschaften anzuzeigen
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Intelligente Validierung</h3>
            <p className="text-sm text-muted-foreground">
              Regex-Builder mit Presets für E-Mail, Telefon, PLZ und mehr
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">DataPad Integration</h3>
            <p className="text-sm text-muted-foreground">
              Automatisches Ausfüllen aus DataPad-Schema mit Live-Test
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Massenbearbeitung</h3>
            <p className="text-sm text-muted-foreground">
              Mehrere Felder gleichzeitig bearbeiten mit Smart-Diff
            </p>
          </Card>
        </div>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  )
}
