/**
 * Properties Panel Component
 * Main panel for editing PDF form field properties
 */

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Pin,
  Copy,
  ClipboardPaste,
  FileText,
  CheckSquare,
  Palette,
  Zap,
  Link2,
  PinOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldPropertySection, PropertyRow } from './field-property-section'
import { FieldTypeSelect } from './field-type-select'
import { ValidationBuilder } from './validation-builder'
import { PositionEditor } from './position-editor'
import { DataPadMapper } from './datapad-mapper'
import { BulkEditPanel } from './bulk-edit-panel'
import {
  usePropertiesPanel,
  usePropertiesPanelShortcuts,
} from '@/hooks/use-properties-panel'
import { useFieldUpdate, formatRelativeTime } from '@/hooks/use-field-update'
import { editorToPrismaUpdate } from '@/lib/web-adobe/field-mapper'
import { FormField } from '@/types/pdf-viewer'
import { FieldType } from '@/types/web-adobe'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { labels, tooltips, messages } from '@/lib/web-adobe/de-labels'
import { Switch } from '@/components/ui/switch'

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: labels.fieldTypes.text, icon: '📝' },
  { value: 'number', label: labels.fieldTypes.number, icon: '🔢' },
  { value: 'email', label: labels.fieldTypes.email, icon: '📧' },
  { value: 'date', label: labels.fieldTypes.date, icon: '📅' },
  { value: 'checkbox', label: labels.fieldTypes.checkbox, icon: '☑️' },
  { value: 'radio', label: labels.fieldTypes.radio, icon: '🔘' },
  { value: 'dropdown', label: labels.fieldTypes.dropdown, icon: '📋' },
  { value: 'signature', label: labels.fieldTypes.signature, icon: '✍️' },
]

export function PropertiesPanel() {
  const {
    isOpen,
    isPinned,
    selectedFields,
    activeSection,
    clipboardProperties,
    closePanel,
    setPinned,
    setActiveSection,
    copyProperties,
    pasteProperties,
  } = usePropertiesPanel()

  // Local field state for optimistic updates
  const [localField, setLocalField] = useState<FormField | null>(null)

  // Get document ID from current field (assuming all selected fields are from same document)
  const currentDocumentId = selectedFields[0]?.id?.split('_')[0] || ''

  // Auto-save hook
  const { updateField, isSaving, lastSaved, error: saveError } = useFieldUpdate({
    documentId: currentDocumentId,
    onSuccess: (field) => {
      toast.success('Feld gespeichert')
      console.log('[PropertiesPanel] Field saved:', field)
    },
    onError: (error, fieldId, originalData) => {
      toast.error('Fehler beim Speichern', {
        description: error.message,
        action: {
          label: 'Erneut versuchen',
          onClick: () => {
            if (localField) {
              handleFieldUpdate(originalData as Partial<FormField>)
            }
          },
        },
      })
      console.error('[PropertiesPanel] Save error:', error)
    },
  })

  // Register keyboard shortcuts
  usePropertiesPanelShortcuts()

  // Sync local field with selected field
  useEffect(() => {
    if (selectedFields.length === 1) {
      const field = selectedFields[0]
      setLocalField(field || null)
    } else {
      setLocalField(null)
    }
  }, [selectedFields])

  // Automatically close panel when no fields selected (unless pinned)
  useEffect(() => {
    if (!isPinned && selectedFields.length === 0 && isOpen) {
      closePanel()
    }
  }, [selectedFields, isPinned, isOpen, closePanel])

  // Keyboard shortcut: Ctrl+S for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (localField) {
          // Force immediate save
          toast.info('Speichere Änderungen...')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [localField])

  const isBulkEdit = selectedFields.length > 1
  const currentField = (localField || selectedFields[0]) as any

  const handleCopyProperties = () => {
    if (!currentField) return

    const properties = {
      required: currentField.required,
      readOnly: currentField.readOnly,
      metadata: currentField.metadata,
    }

    copyProperties(properties)
    toast.success(messages.saved)
  }

  const handlePasteProperties = () => {
    const properties = pasteProperties()
    if (!properties) {
      toast.error('Keine Eigenschaften in der Zwischenablage')
      return
    }

    // Apply properties to current field(s)
    toast.success(messages.applied)
  }

  /**
   * Handle field updates with optimistic UI and auto-save
   */
  const handleFieldUpdate = (updates: any) => {
    if (!currentField) return

    // Optimistic UI update
    const updatedField = { ...currentField, ...updates }
    setLocalField(updatedField as FormField)

    // Convert to Prisma format and trigger auto-save
    const prismaUpdates = editorToPrismaUpdate(updates)
    updateField(currentField.id, prismaUpdates)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => !isPinned && closePanel()}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed right-0 top-0 z-50 h-screen w-full sm:w-[400px]',
              'border-l bg-background shadow-2xl',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{labels.panelTitle}</h2>
              </div>

              <div className="flex items-center gap-1">
                {/* Copy/Paste Buttons */}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleCopyProperties}
                        disabled={!currentField || isBulkEdit}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eigenschaften kopieren</p>
                      <p className="text-xs text-muted-foreground">Strg+C</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handlePasteProperties}
                        disabled={!clipboardProperties || !currentField}
                      >
                        <ClipboardPaste className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eigenschaften einfügen</p>
                      <p className="text-xs text-muted-foreground">Strg+V</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Pin Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setPinned(!isPinned)}
                      >
                        {isPinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPinned ? 'Lösen' : 'Anheften'}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Close Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={closePanel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Schließen</p>
                      <p className="text-xs text-muted-foreground">ESC</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {isBulkEdit ? (
                /* Bulk Edit Mode */
                <BulkEditPanel
                  selectedFields={selectedFields}
                  onApply={handleFieldUpdate}
                  className="p-4"
                />
              ) : currentField ? (
                /* Single Field Edit - Tabs Layout */
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10 bg-background">
                    <TabsTrigger value="general" className="text-xs">
                      {labels.sections.basis}
                    </TabsTrigger>
                    <TabsTrigger value="position" className="text-xs">
                      {labels.sections.position}
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="text-xs">
                      {labels.sections.darstellung}
                    </TabsTrigger>
                    <TabsTrigger value="validation" className="text-xs">
                      {labels.sections.validierung}
                    </TabsTrigger>
                    <TabsTrigger value="datapad" className="text-xs">
                      DataPad
                    </TabsTrigger>
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-name" className="text-sm font-medium">
                          {labels.basis.fieldName}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id="field-name"
                          value={currentField.name}
                          onChange={(e) =>
                            handleFieldUpdate({ name: e.target.value })
                          }
                          placeholder={labels.basis.fieldName}
                        />
                        <p className="text-xs text-muted-foreground">
                          Technischer Name für interne Verwendung
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="display-name" className="text-sm font-medium">
                          {labels.basis.displayName}
                        </Label>
                        <Input
                          id="display-name"
                          value={currentField.displayName}
                          onChange={(e) =>
                            handleFieldUpdate({ displayName: e.target.value })
                          }
                          placeholder="Anzeigename für Benutzer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="field-type" className="text-sm font-medium">
                          {labels.basis.fieldType}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <FieldTypeSelect
                          value={currentField.type as FieldType}
                          onChange={(value: FieldType) =>
                            handleFieldUpdate({ type: value as any })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                          {labels.basis.description}
                        </Label>
                        <Input
                          id="description"
                          value={currentField.metadata.tooltip || ''}
                          onChange={(e) =>
                            handleFieldUpdate({ metadata: { ...currentField.metadata, tooltip: e.target.value } })
                          }
                          placeholder="Beschreibung oder Hilfetext"
                        />
                      </div>

                      <Separator />

                      {/* Behavior Switches */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="required" className="text-sm cursor-pointer">
                              {labels.validierung.required}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Muss ausgefüllt werden
                            </p>
                          </div>
                          <Switch
                            id="required"
                            checked={currentField.required}
                            onCheckedChange={(checked) =>
                              handleFieldUpdate({
                                required: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="readonly" className="text-sm cursor-pointer">
                              {labels.verhalten.readonly}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Nicht bearbeitbar
                            </p>
                          </div>
                          <Switch
                            id="readonly"
                            checked={currentField.readOnly}
                            onCheckedChange={(checked) =>
                              handleFieldUpdate({
                                readOnly: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="hidden" className="text-sm cursor-pointer">
                              {labels.verhalten.hidden}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Unsichtbar im Formular
                            </p>
                          </div>
                          <Switch
                            id="hidden"
                            checked={false}
                            onCheckedChange={(checked) =>
                              handleFieldUpdate({} as any)
                            }
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Position Tab */}
                  <TabsContent value="position" className="p-4">
                    <PositionEditor
                      position={{ ...currentField.rect, page: currentField.page }}
                      onChange={(position) => handleFieldUpdate({ rect: { x: position.x, y: position.y, width: position.width, height: position.height }, page: position.page })}
                    />
                  </TabsContent>

                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="font-size" className="text-sm font-medium">
                          {labels.darstellung.fontSize}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="font-size"
                            type="number"
                            min={8}
                            max={72}
                            value={currentField.style.fontSize}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  fontSize: Number(e.target.value),
                                },
                              })
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {labels.darstellung.pt}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-color" className="text-sm font-medium">
                          {labels.darstellung.fontColor}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="font-color"
                            type="color"
                            value={currentField.style.color}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  color: e.target.value,
                                },
                              })
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={currentField.style.color}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  color: e.target.value,
                                },
                              })
                            }
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bg-color" className="text-sm font-medium">
                          {labels.darstellung.background}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="bg-color"
                            type="color"
                            value={currentField.style.backgroundColor || '#ffffff'}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  backgroundColor: e.target.value,
                                },
                              })
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={currentField.style.backgroundColor || '#ffffff'}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  backgroundColor: e.target.value,
                                },
                              })
                            }
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="border-width" className="text-sm font-medium">
                          {labels.darstellung.borderWidth}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="border-width"
                            type="number"
                            min={0}
                            max={10}
                            value={currentField.style.borderWidth || 1}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  borderWidth: Number(e.target.value),
                                },
                              })
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {labels.darstellung.px}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="border-color" className="text-sm font-medium">
                          {labels.darstellung.borderColor}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="border-color"
                            type="color"
                            value={currentField.style.borderColor || '#000000'}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  borderColor: e.target.value,
                                },
                              })
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={currentField.style.borderColor || '#000000'}
                            onChange={(e) =>
                              handleFieldUpdate({
                                style: {
                                  ...currentField.style,
                                  borderColor: e.target.value,
                                },
                              })
                            }
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Validation Tab */}
                  <TabsContent value="validation" className="p-4">
                    <ValidationBuilder
                      pattern={currentField.validation?.pattern}
                      errorMessage={currentField.validation?.message}
                      onChange={(pattern, errorMessage) => {
                        handleFieldUpdate({
                          validation: {
                            ...currentField.validation,
                            pattern,
                            message: errorMessage,
                          },
                        })
                      }}
                    />
                  </TabsContent>

                  {/* DataPad Tab */}
                  <TabsContent value="datapad" className="p-4">
                    <DataPadMapper
                      mapping={currentField.dataPadMapping}
                      onChange={(mapping) =>
                        handleFieldUpdate({ dataPadMapping: mapping })
                      }
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                /* No Selection */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-sm font-semibold mb-1">
                    Kein Feld ausgewählt
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Wählen Sie ein Formularfeld aus, um dessen Eigenschaften zu
                    bearbeiten
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Footer with Save Status */}
            {currentField && (
              <>
                <Separator />
                <div className="p-4 space-y-3">
                  {/* Save Status Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    {isSaving && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Speichert...</span>
                      </div>
                    )}
                    {!isSaving && lastSaved && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Gespeichert: {formatRelativeTime(lastSaved)}</span>
                      </div>
                    )}
                    {!isSaving && saveError && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>Fehler beim Speichern</span>
                      </div>
                    )}
                    {!isSaving && !lastSaved && !saveError && (
                      <div className="text-muted-foreground">
                        <span>Änderungen werden automatisch gespeichert</span>
                      </div>
                    )}

                    {/* Keyboard Hint */}
                    <div className="text-muted-foreground">
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        Strg+S
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={closePanel}
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
