/**
 * Validation Builder Component
 * Visual regex builder with presets and live testing
 */

'use client'

import { useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  VALIDATION_PRESETS,
  testValidationPattern,
} from '@/lib/web-adobe/validation-presets'
import { ValidationPreset } from '@/types/web-adobe'
import { cn } from '@/lib/utils'

interface ValidationBuilderProps {
  pattern?: string
  errorMessage?: string
  onChange: (pattern: string, errorMessage: string) => void
  className?: string
}

export function ValidationBuilder({
  pattern = '',
  errorMessage = '',
  onChange,
  className,
}: ValidationBuilderProps) {
  const [activeTab, setActiveTab] = useState<ValidationPreset>('email')
  const [customPattern, setCustomPattern] = useState(pattern)
  const [customMessage, setCustomMessage] = useState(errorMessage)
  const [testValue, setTestValue] = useState('')
  const [testResult, setTestResult] = useState<{
    isValid: boolean
    message?: string
  } | null>(null)

  const handlePresetSelect = (preset: ValidationPreset) => {
    setActiveTab(preset)
    if (preset !== 'custom') {
      const presetData = VALIDATION_PRESETS[preset]
      if (presetData) {
        setCustomPattern(presetData.pattern)
        setCustomMessage(presetData.errorMessage)
        onChange(presetData.pattern, presetData.errorMessage)
      }
    }
  }

  const handleCustomChange = (newPattern: string, newMessage: string) => {
    setCustomPattern(newPattern)
    setCustomMessage(newMessage)
    onChange(newPattern, newMessage)
  }

  const handleTest = () => {
    if (!customPattern || !testValue) {
      setTestResult(null)
      return
    }

    const result = testValidationPattern(testValue, customPattern)
    setTestResult(result)
  }

  // Group presets by category
  const presetGroups = {
    common: ['email', 'phone', 'date', 'url'] as ValidationPreset[],
    text: ['alphanumeric', 'alpha', 'numeric', 'username'] as ValidationPreset[],
    numbers: ['decimal', 'percentage'] as ValidationPreset[],
    german: ['zip', 'iban', 'taxId', 'germanName'] as ValidationPreset[],
    technical: ['ipv4', 'macAddress', 'hexColor'] as ValidationPreset[],
    security: ['strongPassword'] as ValidationPreset[],
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Preset Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Validierungsvorlage</Label>
        <Select
          value={activeTab}
          onValueChange={(v) => handlePresetSelect(v as ValidationPreset)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vorlage wählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Eigenes Muster</SelectItem>

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Häufig verwendet
            </div>
            {presetGroups.common.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Texteingaben
            </div>
            {presetGroups.text.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Zahlen
            </div>
            {presetGroups.numbers.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Deutschland-spezifisch
            </div>
            {presetGroups.german.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Technisch
            </div>
            {presetGroups.technical.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Sicherheit
            </div>
            {presetGroups.security.map((preset) => {
              const data = VALIDATION_PRESETS[preset]
              if (!data) return null
              return (
                <SelectItem key={preset} value={preset}>
                  {data.description}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => handlePresetSelect(v as ValidationPreset)}>
        <TabsList className="hidden">
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {Object.entries(VALIDATION_PRESETS).map(([key, preset]) => {
          if (!preset) return null

          return (
            <TabsContent key={key} value={key} className="space-y-3">
              <div className="rounded-md bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{preset.description}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Preset
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Beispiel: <code className="text-xs">{preset.example}</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`pattern-${key}`}>Regex-Muster</Label>
                <Input
                  id={`pattern-${key}`}
                  value={preset.pattern}
                  readOnly
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`message-${key}`}>Fehlermeldung</Label>
                <Input
                  id={`message-${key}`}
                  value={preset.errorMessage}
                  readOnly
                />
              </div>
            </TabsContent>
          )
        })}

        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="custom-pattern">Regex-Muster</Label>
            <Textarea
              id="custom-pattern"
              value={customPattern}
              onChange={(e) => handleCustomChange(e.target.value, customMessage)}
              placeholder="^[A-Z]{2}\d{6}$"
              className="font-mono text-sm resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Geben Sie ein gültiges JavaScript Regex-Muster ein
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-message">Fehlermeldung</Label>
            <Input
              id="custom-message"
              value={customMessage}
              onChange={(e) => handleCustomChange(customPattern, e.target.value)}
              placeholder="Bitte geben Sie einen gültigen Wert ein"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Testing Section */}
      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-semibold">Live-Test</Label>

        <div className="flex gap-2">
          <Input
            value={testValue}
            onChange={(e) => {
              setTestValue(e.target.value)
              setTestResult(null)
            }}
            placeholder="Testwert eingeben..."
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          />
          <Button onClick={handleTest} size="sm" variant="outline">
            Test
          </Button>
        </div>

        {testResult && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              testResult.isValid
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {testResult.isValid ? (
              <>
                <Check className="h-4 w-4" />
                <span className="font-medium">Gültig</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                <span className="font-medium">Ungültig</span>
                {testResult.message && (
                  <>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-xs">{testResult.message}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {customPattern && !testValue && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Geben Sie einen Testwert ein, um die Validierung zu prüfen</span>
          </div>
        )}
      </div>
    </div>
  )
}
