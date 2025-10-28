/**
 * Shared Password Validation
 *
 * Wird sowohl im Frontend als auch Backend verwendet
 * um konsistente Password-Policies sicherzustellen
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

// Password Policy Constants
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_LOWERCASE: true,
  REQUIRE_UPPERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const

// Common weak passwords (erweitert)
const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'admin', 'test', 'user', 'guest',
  'password123', 'admin123', 'qwertyuiop', '1234567890', 'asdfghjkl',
  'zxcvbnm', 'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'password1', 'abc123', '123456789', '12345678', '12345', '1234567',
  'password!', 'qwerty123', 'welcome123', 'admin1234',
]

/**
 * Validiert Passwort-Stärke nach OWASP-Standards
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strengthScore = 0

  // 1. Längen-Check
  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`Passwort muss mindestens ${PASSWORD_POLICY.MIN_LENGTH} Zeichen lang sein`)
  } else {
    strengthScore += 1
  }

  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    errors.push(`Passwort darf maximal ${PASSWORD_POLICY.MAX_LENGTH} Zeichen lang sein`)
  }

  // 2. Komplexitäts-Anforderungen
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten')
  } else {
    strengthScore += 1
  }

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Großbuchstaben enthalten')
  } else {
    strengthScore += 1
  }

  if (PASSWORD_POLICY.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten')
  } else {
    strengthScore += 1
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(password)) {
    errors.push('Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&* etc.)')
  } else {
    strengthScore += 1
  }

  // 3. Häufige Passwörter blocken
  const lowerPassword = password.toLowerCase()
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    errors.push('Dieses Passwort ist zu häufig verwendet und unsicher')
    strengthScore = 0
  }

  // 4. Check für wiederholte Zeichen (z.B. "aaaa", "1111")
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Passwort enthält zu viele wiederholte Zeichen')
  }

  // 5. Check für sequenzielle Zeichen
  const hasSequential = checkSequentialCharacters(password)
  if (hasSequential) {
    errors.push('Passwort enthält sequenzielle Zeichen (z.B. "1234", "abcd")')
  }

  // 6. Check ob Passwort nur aus Username oder Email besteht
  // (wird später im Backend mit tatsächlichen Werten geprüft)

  // 7. Bonus-Punkte für längere Passwörter
  if (password.length >= 16) strengthScore += 1
  if (password.length >= 20) strengthScore += 1

  // 8. Bonus für Vielfalt an Zeichen
  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(password),
  ].filter(Boolean).length

  if (charTypes === 4) strengthScore += 1

  // Strength-Berechnung
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (strengthScore >= 7) strength = 'strong'
  else if (strengthScore >= 5) strength = 'medium'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Prüft auf sequenzielle Zeichen
 */
function checkSequentialCharacters(password: string): boolean {
  const lowerPassword = password.toLowerCase()

  const sequences = [
    '0123456789',
    '9876543210',
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ]

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const chunk = seq.substring(i, i + 4)
      if (lowerPassword.includes(chunk)) {
        return true
      }
    }
  }

  return false
}

/**
 * Generiert Password-Strength Indikator für UI
 */
export function getPasswordStrengthIndicator(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  color: string
  text: string
  percentage: number
} {
  const result = validatePassword(password)

  const indicators = {
    weak: {
      strength: 'weak' as const,
      color: 'bg-red-500',
      text: 'Schwach',
      percentage: 33,
    },
    medium: {
      strength: 'medium' as const,
      color: 'bg-yellow-500',
      text: 'Mittel',
      percentage: 66,
    },
    strong: {
      strength: 'strong' as const,
      color: 'bg-green-500',
      text: 'Stark',
      percentage: 100,
    },
  }

  return indicators[result.strength]
}

/**
 * Frontend-Hilfe: Formatierte Fehlermeldungen
 */
export function getPasswordRequirements(): string[] {
  return [
    `Mindestens ${PASSWORD_POLICY.MIN_LENGTH} Zeichen`,
    'Mindestens ein Kleinbuchstabe (a-z)',
    'Mindestens ein Großbuchstabe (A-Z)',
    'Mindestens eine Zahl (0-9)',
    'Mindestens ein Sonderzeichen (!@#$%^&* etc.)',
    'Keine häufig verwendeten Passwörter',
    'Keine wiederholten oder sequenziellen Zeichen',
  ]
}
