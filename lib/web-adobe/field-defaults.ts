/**
 * Field Defaults
 * Default configurations for different field types
 */

import { FormField, FieldType } from '@/types/web-adobe'

export function createDefaultField(type: FieldType): FormField {
  const baseField = {
    id: crypto.randomUUID(),
    name: `field_${Date.now()}`,
    displayName: '',
    type,
    position: {
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      page: 1,
    },
    style: {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 1,
      borderStyle: 'solid' as const,
      textAlign: 'left' as const,
      padding: 4,
    },
    validation: {
      required: false,
    },
    behavior: {
      readOnly: false,
      hidden: false,
      calculated: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Type-specific configurations
  switch (type) {
    case 'text':
      return {
        ...baseField,
        typeProperties: {
          placeholder: '',
          multiline: false,
          passwordMask: false,
        },
      }

    case 'number':
      return {
        ...baseField,
        typeProperties: {
          min: undefined,
          max: undefined,
          decimalPlaces: 2,
          thousandsSeparator: true,
        },
      }

    case 'email':
      return {
        ...baseField,
        validation: {
          required: false,
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
        typeProperties: {
          placeholder: 'beispiel@domain.de',
          multiline: false,
          passwordMask: false,
        },
      }

    case 'checkbox':
      return {
        ...baseField,
        position: {
          ...baseField.position,
          width: 20,
          height: 20,
        },
        typeProperties: {
          checkedByDefault: false,
          exportValue: 'Yes',
        },
      }

    case 'radio':
      return {
        ...baseField,
        position: {
          ...baseField.position,
          width: 20,
          height: 20,
        },
        typeProperties: {
          groupName: 'radioGroup1',
          options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
          ],
        },
      }

    case 'dropdown':
      return {
        ...baseField,
        typeProperties: {
          options: [
            { label: 'Bitte auswählen', value: '' },
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
          ],
          allowCustom: false,
          multiSelect: false,
          searchable: false,
        },
      }

    case 'signature':
      return {
        ...baseField,
        position: {
          ...baseField.position,
          width: 300,
          height: 100,
        },
        validation: {
          required: true,
        },
        typeProperties: {
          required: true,
          showClearButton: true,
          includeTimestamp: true,
          signatureType: 'draw' as const,
        },
      }

    case 'date':
      return {
        ...baseField,
        validation: {
          required: false,
          pattern: '^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.(19|20)\\d{2}$',
        },
        typeProperties: {
          placeholder: 'TT.MM.JJJJ',
          multiline: false,
          passwordMask: false,
        },
      }

    default:
      return {
        ...baseField,
        typeProperties: {},
      }
  }
}

/**
 * Field type icons mapping
 */
export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text: '📝',
  textarea: '📄',
  number: '🔢',
  email: '📧',
  phone: '📱',
  date: '📅',
  checkbox: '☑️',
  radio: '⚪',
  dropdown: '📋',
  signature: '✍️',
}

/**
 * Field type descriptions
 */
export const FIELD_TYPE_DESCRIPTIONS: Record<FieldType, string> = {
  text: 'Einzeiliges Textfeld',
  textarea: 'Mehrzeiliges Textfeld',
  number: 'Numerisches Eingabefeld mit Formatierung',
  email: 'E-Mail-Adresse mit automatischer Validierung',
  phone: 'Telefonnummer mit Formatierung',
  date: 'Datumsauswahl im Format TT.MM.JJJJ',
  checkbox: 'Ja/Nein-Auswahlfeld',
  radio: 'Einfachauswahl aus mehreren Optionen',
  dropdown: 'Auswahlliste mit vordefinierten Optionen',
  signature: 'Unterschriftenfeld mit Zeitstempel',
}
