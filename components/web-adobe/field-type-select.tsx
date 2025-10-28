/**
 * Field Type Select Component
 * Dropdown zur Auswahl des Feldtyps mit Icons und deutschen Labels
 */

'use client'

import { FieldType } from '@/types/web-adobe'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { labels } from '@/lib/web-adobe/de-labels'

interface FieldTypeOption {
  value: FieldType
  label: string
  icon: string
  description: string
}

const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  {
    value: 'text',
    label: labels.fieldTypes.text,
    icon: '📝',
    description: 'Einzeiliges Textfeld für kurze Eingaben'
  },
  {
    value: 'textarea',
    label: labels.fieldTypes.textarea,
    icon: '📄',
    description: 'Mehrzeiliges Textfeld für längere Texte'
  },
  {
    value: 'number',
    label: labels.fieldTypes.number,
    icon: '🔢',
    description: 'Numerische Eingabe mit Validierung'
  },
  {
    value: 'email',
    label: labels.fieldTypes.email,
    icon: '📧',
    description: 'E-Mail-Adresse mit Format-Validierung'
  },
  {
    value: 'phone',
    label: labels.fieldTypes.phone,
    icon: '📞',
    description: 'Telefonnummer mit Format-Validierung'
  },
  {
    value: 'date',
    label: labels.fieldTypes.date,
    icon: '📅',
    description: 'Datumsauswahl mit Kalender'
  },
  {
    value: 'checkbox',
    label: labels.fieldTypes.checkbox,
    icon: '☑️',
    description: 'Ankreuzfeld für Ja/Nein-Optionen'
  },
  {
    value: 'radio',
    label: labels.fieldTypes.radio,
    icon: '🔘',
    description: 'Optionsfeld für Einzelauswahl'
  },
  {
    value: 'dropdown',
    label: labels.fieldTypes.dropdown,
    icon: '📋',
    description: 'Dropdown-Liste mit mehreren Optionen'
  },
  {
    value: 'signature',
    label: labels.fieldTypes.signature,
    icon: '✍️',
    description: 'Unterschriftenfeld mit Zeichenfläche'
  }
]

interface FieldTypeSelectProps {
  value: FieldType
  onChange: (value: FieldType) => void
  disabled?: boolean
  className?: string
}

export function FieldTypeSelect({
  value,
  onChange,
  disabled = false,
  className
}: FieldTypeSelectProps) {
  const selectedOption = FIELD_TYPE_OPTIONS.find(opt => opt.value === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-base">{selectedOption?.icon}</span>
            <span>{selectedOption?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Eingabefelder</SelectLabel>
          {FIELD_TYPE_OPTIONS.filter(opt =>
            ['text', 'textarea', 'number', 'email', 'phone', 'date'].includes(opt.value)
          ).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-3 py-1">
                <span className="text-lg">{option.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Auswahlfelder</SelectLabel>
          {FIELD_TYPE_OPTIONS.filter(opt =>
            ['checkbox', 'radio', 'dropdown'].includes(opt.value)
          ).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-3 py-1">
                <span className="text-lg">{option.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Spezialfelder</SelectLabel>
          {FIELD_TYPE_OPTIONS.filter(opt =>
            ['signature'].includes(opt.value)
          ).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-3 py-1">
                <span className="text-lg">{option.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
