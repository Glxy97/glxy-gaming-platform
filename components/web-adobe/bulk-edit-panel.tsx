/**
 * Bulk Edit Panel Component
 * Multi-select mode for editing multiple fields simultaneously
 */

'use client'

import { Users, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FormField, FieldMetadata } from '@/types/pdf-viewer'
import { cn } from '@/lib/utils'

interface BulkEditPanelProps {
  selectedFields: FormField[]
  onApply: (changes: Partial<FormField>) => void
  className?: string
}

export function BulkEditPanel({
  selectedFields,
  onApply,
  className,
}: BulkEditPanelProps) {
  const fieldCount = selectedFields.length

  if (fieldCount === 0) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Keine Felder ausgewählt
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Wählen Sie mehrere Felder für Massenbearbeitung
          </p>
        </div>
      </div>
    )
  }

  // Analyze common properties
  const hasCommonType = new Set(selectedFields.map((f) => f.type)).size === 1
  const hasCommonRequired = new Set(
    selectedFields.map((f) => f.required)
  ).size === 1
  const hasCommonFontSize = new Set(
    selectedFields.map((f) => f.metadata.fontSize)
  ).size === 1
  const hasCommonReadOnly = new Set(
    selectedFields.map((f) => f.readOnly)
  ).size === 1

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            Massenbearbeitung
          </span>
        </div>
        <Badge variant="secondary" className="font-mono">
          {fieldCount} {fieldCount === 1 ? 'Feld' : 'Felder'}
        </Badge>
      </div>

      <Separator />

      {/* Info Banner */}
      <div className="flex items-start gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">
            Änderungen werden auf alle ausgewählten Felder angewendet
          </p>
        </div>
      </div>

      {/* Field Type (Read-only) */}
      <div className="space-y-2">
        <Label className="text-xs">Feldtyp</Label>
        {hasCommonType ? (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {selectedFields[0]?.type || 'Unbekannt'}
          </div>
        ) : (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            Gemischt - verschiedene Typen
          </div>
        )}
      </div>

      {/* Common Editable Properties */}
      <div className="space-y-3">
        {/* Required Field */}
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="bulk-required" className="text-sm cursor-pointer">
              Pflichtfeld
            </Label>
            {!hasCommonRequired && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Gemischt
              </p>
            )}
          </div>
          <Switch
            id="bulk-required"
            checked={hasCommonRequired && (selectedFields[0]?.required || false)}
            onCheckedChange={(checked) => {
              onApply({
                required: checked,
              })
            }}
          />
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bulk-font-size" className="text-xs">
              Schriftgröße
            </Label>
            {!hasCommonFontSize && (
              <Badge variant="outline" className="text-xs">
                Gemischt
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="bulk-font-size"
              type="number"
              min={8}
              max={72}
              defaultValue={hasCommonFontSize ? selectedFields[0]?.metadata?.fontSize : 12}
              onChange={(e) => {
                onApply({
                  metadata: {
                    ...(selectedFields[0]?.metadata || {}),
                    fontSize: Number(e.target.value),
                  } as FieldMetadata,
                })
              }}
              className="h-8"
            />
            <span className="text-xs text-muted-foreground">pt</span>
          </div>
        </div>

        {/* Read-only */}
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="bulk-readonly" className="text-sm cursor-pointer">
              Schreibgeschützt
            </Label>
            {!hasCommonReadOnly && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Gemischt
              </p>
            )}
          </div>
          <Switch
            id="bulk-readonly"
            checked={hasCommonReadOnly && (selectedFields[0]?.readOnly || false)}
            onCheckedChange={(checked) => {
              onApply({
                readOnly: checked,
              })
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Apply Button */}
      <Button className="w-full" size="sm">
        Änderungen auf alle anwenden
      </Button>

      {/* Selected Fields List */}
      <div className="rounded-md border bg-muted/20 p-3 space-y-2">
        <Label className="text-xs">Ausgewählte Felder:</Label>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {selectedFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between text-xs py-1"
            >
              <span className="font-medium">{field.displayName || field.name}</span>
              <Badge variant="outline" className="text-xs">
                {field.type}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
