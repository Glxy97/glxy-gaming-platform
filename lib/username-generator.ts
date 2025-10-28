// @ts-nocheck
/**
 * Random Username Generator
 * Generiert zufällige Benutzernamen für OAuth-Benutzer
 */

const adjectives = [
  'Gaming', 'Epic', 'Super', 'Ultra', 'Mega', 'Pro', 'Elite',
  'Shadow', 'Swift', 'Thunder', 'Cyber', 'Neon', 'Cosmic',
  'Mystic', 'Turbo', 'Ninja', 'Dragon', 'Phoenix', 'Storm',
  'Quantum', 'Digital', 'Pixel', 'Retro', 'Hyper', 'Alpha'
]

const nouns = [
  'Player', 'Gamer', 'Hero', 'Champion', 'Warrior', 'Hunter',
  'Master', 'Legend', 'Striker', 'Raider', 'Knight', 'Wizard',
  'Fighter', 'Runner', 'Sniper', 'Pilot', 'Guardian', 'Ranger',
  'Slayer', 'Assassin', 'Samurai', 'Ninja', 'Commander', 'Agent'
]

/**
 * Generiert einen zufälligen Benutzernamen
 * Format: {Adjektiv}{Nomen}{3-4 Ziffern}
 * Beispiel: GamingHero4782
 */
export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 9000) + 1000 // 1000-9999

  return `${adjective}${noun}${number}`
}

/**
 * Validiert einen Benutzernamen
 * - Min 3, Max 20 Zeichen
 * - Nur Buchstaben, Zahlen, Unterstrich
 * - Darf nicht nur aus Zahlen bestehen
 */
export function validateUsername(username: string): {
  valid: boolean
  error?: string
} {
  if (!username || username.length < 3) {
    return {
      valid: false,
      error: 'Benutzername muss mindestens 3 Zeichen lang sein'
    }
  }

  if (username.length > 20) {
    return {
      valid: false,
      error: 'Benutzername darf maximal 20 Zeichen lang sein'
    }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Benutzername darf nur Buchstaben, Zahlen und Unterstrich enthalten'
    }
  }

  const onlyNumbers = /^\d+$/
  if (onlyNumbers.test(username)) {
    return {
      valid: false,
      error: 'Benutzername darf nicht nur aus Zahlen bestehen'
    }
  }

  return { valid: true }
}
