/**
 * DataPad Mapper Component
 * Configure DataPad integration for form fields
 */

'use client'

import { useState } from 'react'
import { Link2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataPadMapping } from '@/types/web-adobe'
import { cn } from '@/lib/utils'
import { dataPadMappingSuggestions, labels } from '@/lib/web-adobe/de-labels'

interface DataPadMapperProps {
  mapping?: DataPadMapping
  onChange: (mapping: DataPadMapping) => void
  className?: string
}

// DataPad schema keys grouped by category
const DATAPAD_SCHEMA_KEYS = dataPadMappingSuggestions.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = []
  }
  acc[item.category]?.push({ value: item.key, label: item.label })
  return acc
}, {} as Record<string, Array<{ value: string; label: string }>>)

export function DataPadMapper({
  mapping,
  onChange,
  className,
}: DataPadMapperProps) {
  const [isConnected, setIsConnected] = useState(!!mapping?.mappingKey)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    value?: string
    message?: string
  } | null>(null)

  const handleMappingChange = (
    key: keyof DataPadMapping,
    value: any
  ) => {
    const newMapping = {
      mappingKey: mapping?.mappingKey || '',
      autoFill: mapping?.autoFill ?? true,
      syncDirection: mapping?.syncDirection || 'bidirectional',
      ...mapping,
      [key]: value,
    } as DataPadMapping

    onChange(newMapping)
  }

  const handleTestMapping = async () => {
    setIsTesting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock test result
    setTestResult({
      success: true,
      value: 'Max Mustermann',
      message: 'Verbindung erfolgreich',
    })

    setIsTesting(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
          isConnected
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : 'bg-muted'
        )}
      >
        {isConnected ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Mit DataPad verbunden</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Noch nicht mit DataPad verbunden
            </span>
          </>
        )}
      </div>

      {/* Mapping Key Selection */}
      <div className="space-y-2">
        <Label htmlFor="mapping-key">{labels.datapad.mappingKey}</Label>
        <Select
          value={mapping?.mappingKey || ''}
          onValueChange={(value) => {
            handleMappingChange('mappingKey', value)
            setIsConnected(!!value)
          }}
        >
          <SelectTrigger id="mapping-key">
            <SelectValue placeholder="Feld auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATAPAD_SCHEMA_KEYS).map(([category, items]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {labels.datapad.suggestedMappings}: Häufig verwendete Zuordnungen
        </p>
      </div>

      {isConnected && (
        <>
          {/* Auto-Fill Toggle */}
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="auto-fill" className="text-sm cursor-pointer">
                Automatisches Ausfüllen
              </Label>
              <p className="text-xs text-muted-foreground">
                Feld wird automatisch mit DataPad-Daten gefüllt
              </p>
            </div>
            <Switch
              id="auto-fill"
              checked={mapping?.autoFill ?? true}
              onCheckedChange={(checked) =>
                handleMappingChange('autoFill', checked)
              }
            />
          </div>

          {/* Sync Direction */}
          <div className="space-y-2">
            <Label htmlFor="sync-direction">Synchronisationsrichtung</Label>
            <Select
              value={mapping?.syncDirection || 'bidirectional'}
              onValueChange={(value) =>
                handleMappingChange('syncDirection', value)
              }
            >
              <SelectTrigger id="sync-direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf-to-datapad">
                  PDF → DataPad
                </SelectItem>
                <SelectItem value="datapad-to-pdf">
                  DataPad → PDF
                </SelectItem>
                <SelectItem value="bidirectional">
                  Bidirektional ⇄
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Legen Sie fest, in welche Richtung Daten synchronisiert werden
            </p>
          </div>

          {/* Test Connection Button */}
          <Button
            onClick={handleTestMapping}
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Teste Verbindung...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verbindung testen
              </>
            )}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-md px-3 py-2 text-sm',
                testResult.success
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.value && (
                  <p className="text-xs">
                    Beispielwert: <code>{testResult.value}</code>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Vorschau
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Wenn ein Benutzer dieses Formular öffnet, wird das Feld
              automatisch mit dem Wert aus{' '}
              <code className="text-xs">{mapping?.mappingKey}</code> gefüllt.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
