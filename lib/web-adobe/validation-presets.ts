/**
 * Validation Presets
 * Pre-configured regex patterns for common field types
 */

import { ValidationPreset } from '@/types/web-adobe'

export interface ValidationPattern {
  pattern: string
  description: string
  example: string
  errorMessage: string
}

export const VALIDATION_PRESETS: Record<ValidationPreset, ValidationPattern | null> = {
  email: {
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: 'Gültige E-Mail-Adresse',
    example: 'beispiel@domain.de',
    errorMessage: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
  },
  phone: {
    pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[0-9]{1,9}$',
    description: 'Telefonnummer (verschiedene Formate)',
    example: '+49 123 456789',
    errorMessage: 'Bitte geben Sie eine gültige Telefonnummer ein',
  },
  zip: {
    pattern: '^[0-9]{5}$',
    description: 'Deutsche Postleitzahl (5 Ziffern)',
    example: '12345',
    errorMessage: 'Bitte geben Sie eine 5-stellige Postleitzahl ein',
  },
  date: {
    pattern: '^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.(19|20)\\d{2}$',
    description: 'Datum im Format TT.MM.JJJJ',
    example: '31.12.2024',
    errorMessage: 'Bitte geben Sie ein Datum im Format TT.MM.JJJJ ein',
  },
  url: {
    pattern: '^(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&\\/\\/=]*)$',
    description: 'Gültige URL',
    example: 'https://www.example.com',
    errorMessage: 'Bitte geben Sie eine gültige URL ein',
  },
  iban: {
    pattern: '^DE\\d{20}$',
    description: 'IBAN (Deutschland)',
    example: 'DE89370400440532013000',
    errorMessage: 'Bitte geben Sie eine gültige deutsche IBAN ein (DE + 20 Ziffern)',
  },
  germanName: {
    pattern: '^[A-Za-zäöüÄÖÜß\\s\\-]{2,50}$',
    description: 'Deutscher Name mit Umlauten',
    example: 'Max Müller-Schmidt',
    errorMessage: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen)',
  },
  taxId: {
    pattern: '^\\d{11}$',
    description: 'Steueridentifikationsnummer',
    example: '12345678901',
    errorMessage: 'Bitte geben Sie eine gültige 11-stellige Steuer-ID ein',
  },
  alphanumeric: {
    pattern: '^[a-zA-Z0-9]+$',
    description: 'Nur Buchstaben und Zahlen',
    example: 'ABC123',
    errorMessage: 'Nur Buchstaben und Zahlen erlaubt',
  },
  alpha: {
    pattern: '^[a-zA-ZäöüÄÖÜß]+$',
    description: 'Nur Buchstaben (inkl. Umlaute)',
    example: 'Müller',
    errorMessage: 'Nur Buchstaben erlaubt',
  },
  numeric: {
    pattern: '^[0-9]+$',
    description: 'Nur Zahlen',
    example: '12345',
    errorMessage: 'Nur Zahlen erlaubt',
  },
  decimal: {
    pattern: '^\\d+([.,]\\d{1,2})?$',
    description: 'Dezimalzahl (max. 2 Nachkommastellen)',
    example: '123,45',
    errorMessage: 'Bitte geben Sie eine gültige Dezimalzahl ein',
  },
  percentage: {
    pattern: '^(100|[1-9]?\\d)%?$',
    description: 'Prozentsatz (0-100)',
    example: '75%',
    errorMessage: 'Bitte geben Sie einen Wert zwischen 0 und 100 ein',
  },
  hexColor: {
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
    description: 'Hex-Farbcode',
    example: '#FF5733',
    errorMessage: 'Bitte geben Sie einen gültigen Hex-Farbcode ein (z.B. #FF5733)',
  },
  username: {
    pattern: '^[a-zA-Z0-9_-]{3,16}$',
    description: 'Benutzername (3-16 Zeichen)',
    example: 'max_mueller',
    errorMessage: 'Benutzername muss 3-16 Zeichen lang sein (Buchstaben, Zahlen, _ und -)',
  },
  strongPassword: {
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    description: 'Starkes Passwort (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen)',
    example: 'P@ssw0rd!',
    errorMessage: 'Passwort muss mindestens 8 Zeichen, einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten',
  },
  ipv4: {
    pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    description: 'IPv4-Adresse',
    example: '192.168.1.1',
    errorMessage: 'Bitte geben Sie eine gültige IPv4-Adresse ein',
  },
  macAddress: {
    pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
    description: 'MAC-Adresse',
    example: '00:1B:63:84:45:E6',
    errorMessage: 'Bitte geben Sie eine gültige MAC-Adresse ein',
  },
  custom: null,
}

/**
 * Test a value against a regex pattern
 */
export function testValidationPattern(
  value: string,
  pattern: string
): { isValid: boolean; message?: string } {
  try {
    const regex = new RegExp(pattern)
    const isValid = regex.test(value)
    return {
      isValid,
      message: isValid ? undefined : 'Wert entspricht nicht dem erforderlichen Format',
    }
  } catch (error) {
    return {
      isValid: false,
      message: 'Ungültiges Regex-Muster',
    }
  }
}

/**
 * Common field name suggestions based on context
 */
export const FIELD_NAME_SUGGESTIONS: Record<string, string[]> = {
  personal: [
    'firstName',
    'lastName',
    'fullName',
    'birthDate',
    'gender',
    'nationality',
  ],
  contact: [
    'email',
    'phone',
    'mobile',
    'address',
    'street',
    'city',
    'zipCode',
    'country',
  ],
  company: [
    'companyName',
    'position',
    'department',
    'employeeId',
    'startDate',
  ],
  financial: [
    'accountNumber',
    'iban',
    'bic',
    'taxId',
    'salary',
    'currency',
  ],
}

/**
 * Display name suggestions (German)
 */
export const DISPLAY_NAME_SUGGESTIONS: Record<string, string> = {
  firstName: 'Vorname',
  lastName: 'Nachname',
  fullName: 'Vollständiger Name',
  birthDate: 'Geburtsdatum',
  email: 'E-Mail-Adresse',
  phone: 'Telefonnummer',
  mobile: 'Mobilnummer',
  address: 'Adresse',
  street: 'Straße',
  city: 'Stadt',
  zipCode: 'Postleitzahl',
  country: 'Land',
  companyName: 'Firmenname',
  position: 'Position',
  department: 'Abteilung',
  accountNumber: 'Kontonummer',
  iban: 'IBAN',
  taxId: 'Steuernummer',
}

/**
 * Get appropriate validation preset for a field name
 */
export function suggestValidationPreset(fieldName: string): ValidationPreset | null {
  const lowerName = fieldName.toLowerCase()

  if (lowerName.includes('email') || lowerName.includes('mail')) {
    return 'email'
  }
  if (lowerName.includes('phone') || lowerName.includes('tel') || lowerName.includes('mobile')) {
    return 'phone'
  }
  if (lowerName.includes('zip') || lowerName.includes('postal')) {
    return 'zip'
  }
  if (lowerName.includes('url') || lowerName.includes('website') || lowerName.includes('link')) {
    return 'url'
  }
  if (lowerName.includes('date') || lowerName.includes('birth')) {
    return 'date'
  }

  return null
}
