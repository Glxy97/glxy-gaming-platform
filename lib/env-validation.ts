/**
 * Environment Variables Validation & Type Safety
 *
 * SECURITY: Validiert alle Umgebungsvariablen beim Server-Start
 * und stellt sicher, dass keine Platzhalter in Production sind
 */

import { z } from 'zod'

// Zod Schema für alle Environment Variables
const envSchema = z.object({
  // ===== NODE ENVIRONMENT =====
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ===== DATABASE =====
  DATABASE_URL: z.string().url().min(1),
  POSTGRES_USER: z.string().min(1).optional(),
  POSTGRES_PASSWORD: z.string().min(1).optional(),
  POSTGRES_DB: z.string().min(1).optional(),

  // ===== REDIS =====
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),

  // ===== NEXTAUTH =====
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // ===== OAUTH PROVIDERS (Optional) =====
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // ===== SOCKET.IO =====
  SOCKET_IO_SECRET: z.string().optional(),
  SOCKET_IO_PORT: z.string().default('3001'),
  SOCKET_IO_CORS_ORIGIN: z.string().optional(),

  // ===== ENCRYPTION KEYS =====
  API_ENCRYPTION_KEY: z.string().optional(),
  SESSION_ENCRYPTION_KEY: z.string().optional(),
  CSRF_SECRET: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),

  // ===== SMTP/EMAIL (Optional) =====
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // ===== SENTRY (Optional) =====
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  DISABLE_SENTRY: z.string().optional(),

  // ===== ADMIN =====
  ADMIN_EMAILS: z.string().optional(),
  ADMIN_USER_IDS: z.string().optional(),

  // ===== PUBLIC VARS =====
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  NEXT_PUBLIC_SOCKET_PATH: z.string().optional(),

  // ===== DOMAIN =====
  DOMAIN: z.string().optional(),
})

// Placeholder-Werte die NICHT in Production erlaubt sind
const FORBIDDEN_PRODUCTION_VALUES = [
  'your_nextauth_secret_here',
  'your_jwt_secret_here',
  'your_google_client_id_here',
  'your_github_client_id_here',
  'google_client_id_placeholder',
  'github_client_id_placeholder',
  'nextauth_super_secret_key_2024_development_only',
  'jwt_super_secret_key_2024_development_only',
]

/**
 * Validiert Environment Variables
 * Wirft Fehler wenn kritische Variablen fehlen oder unsicher sind
 */
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    // Validiere Schema
    const env = envSchema.parse(process.env)

    // Production-spezifische Checks
    if (isProduction) {
      // Check für Placeholder-Werte
      Object.entries(env).forEach(([key, value]) => {
        if (typeof value === 'string' && FORBIDDEN_PRODUCTION_VALUES.includes(value)) {
          throw new Error(
            `❌ SECURITY ERROR: ${key} contains placeholder value in PRODUCTION!\n` +
            `   Value: "${value}"\n` +
            `   Please set a proper production value.`
          )
        }
      })

      // Checke dass OAuth Secrets gesetzt sind (wenn IDs gesetzt sind)
      if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) {
        throw new Error('❌ GOOGLE_CLIENT_SECRET must be set if GOOGLE_CLIENT_ID is provided')
      }
      if (env.GITHUB_CLIENT_ID && !env.GITHUB_CLIENT_SECRET) {
        throw new Error('❌ GITHUB_CLIENT_SECRET must be set if GITHUB_CLIENT_ID is provided')
      }

      // Checke dass NEXTAUTH_SECRET mindestens 32 Zeichen hat
      if (env.NEXTAUTH_SECRET.length < 32) {
        throw new Error('❌ NEXTAUTH_SECRET must be at least 32 characters in production')
      }
    }

    console.log('✅ Environment variables validated successfully')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Environment validation failed. Check the errors above.')
    }
    throw error
  }
}

/**
 * Type-safe Environment-Objekt
 */
export type Env = z.infer<typeof envSchema>

/**
 * Gibt validierte Environment Variables zurück
 */
export function getEnv(): Env {
  return validateEnv()
}

/**
 * Helper: Prüft ob OAuth Provider konfiguriert ist
 */
export function isOAuthProviderConfigured(provider: 'google' | 'github'): boolean {
  if (provider === 'google') {
    return !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !FORBIDDEN_PRODUCTION_VALUES.includes(process.env.GOOGLE_CLIENT_ID)
    )
  }
  if (provider === 'github') {
    return !!(
      process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      !FORBIDDEN_PRODUCTION_VALUES.includes(process.env.GITHUB_CLIENT_ID)
    )
  }
  return false
}

/**
 * Helper: Gibt sicheren Env-Status zurück (für Logging/Debugging)
 */
export function getEnvStatus() {
  return {
    nodeEnv: process.env.NODE_ENV,
    database: !!process.env.DATABASE_URL,
    redis: !!process.env.REDIS_URL,
    auth: {
      nextAuth: !!process.env.NEXTAUTH_SECRET,
      jwt: !!process.env.JWT_SECRET,
    },
    oauth: {
      google: isOAuthProviderConfigured('google'),
      github: isOAuthProviderConfigured('github'),
    },
    smtp: !!process.env.SMTP_HOST && !!process.env.SMTP_USER,
    sentry: !!process.env.SENTRY_DSN && process.env.DISABLE_SENTRY !== 'true',
  }
}
