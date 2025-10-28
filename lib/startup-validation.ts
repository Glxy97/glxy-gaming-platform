/**
 * Startup Validation
 *
 * Dieses Modul führt alle kritischen Validierungen beim Server-Start aus
 * um sicherzustellen, dass die Anwendung korrekt konfiguriert ist
 */

import { validateEnv, getEnvStatus, isOAuthProviderConfigured } from './env-validation'

/**
 * Führt alle Startup-Validierungen aus
 * Wirft Fehler wenn kritische Probleme gefunden werden
 */
export async function runStartupValidation() {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 GLXY Gaming Platform - Startup Validation')
  console.log('='.repeat(80) + '\n')

  try {
    // 1. Validiere Environment Variables
    console.log('📋 Validiere Environment Variables...')
    const env = validateEnv()

    // 2. Zeige Konfigurations-Status
    const status = getEnvStatus()
    console.log('\n📊 Konfigurations-Status:')
    console.log(`   • Environment: ${status.nodeEnv}`)
    console.log(`   • Database: ${status.database ? '✅' : '❌'}`)
    console.log(`   • Redis: ${status.redis ? '✅' : '❌'}`)
    console.log(`   • NextAuth: ${status.auth.nextAuth ? '✅' : '❌'}`)
    console.log(`   • JWT: ${status.auth.jwt ? '✅' : '❌'}`)
    console.log(`   • OAuth Google: ${status.oauth.google ? '✅' : '⚠️  (optional)'}`)
    console.log(`   • OAuth GitHub: ${status.oauth.github ? '✅' : '⚠️  (optional)'}`)
    console.log(`   • SMTP: ${status.smtp ? '✅' : '⚠️  (optional)'}`)
    console.log(`   • Sentry: ${status.sentry ? '✅' : '⚠️  (deaktiviert)'}`)

    // 3. Warnungen für fehlende optionale Features
    const warnings: string[] = []

    if (!status.oauth.google && !status.oauth.github) {
      warnings.push('⚠️  Keine OAuth-Provider konfiguriert. Benutzer können sich nur mit E-Mail/Passwort anmelden.')
    }

    if (!status.smtp) {
      warnings.push('⚠️  SMTP nicht konfiguriert. E-Mail-Verifikation ist deaktiviert.')
    }

    if (!status.redis) {
      warnings.push('⚠️  Redis nicht konfiguriert. Caching und Real-time Features eingeschränkt.')
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnungen:')
      warnings.forEach(w => console.log(`   ${w}`))
    }

    // 4. Production-spezifische Checks
    if (status.nodeEnv === 'production') {
      console.log('\n🔒 Production Mode - Erweiterte Sicherheits-Checks...')

      const productionIssues: string[] = []

      // Check: NEXTAUTH_URL muss HTTPS sein
      if (env.NEXTAUTH_URL && !env.NEXTAUTH_URL.startsWith('https://')) {
        productionIssues.push('❌ NEXTAUTH_URL muss HTTPS in Production verwenden')
      }

      // Check: Sentry sollte in Production aktiv sein
      if (!status.sentry) {
        productionIssues.push('⚠️  Sentry ist in Production deaktiviert. Error Tracking empfohlen.')
      }

      // Check: SMTP sollte konfiguriert sein
      if (!status.smtp) {
        productionIssues.push('⚠️  SMTP nicht konfiguriert. E-Mail-Funktionen deaktiviert.')
      }

      if (productionIssues.length > 0) {
        console.log('\n⚠️  Production Probleme gefunden:')
        productionIssues.forEach(issue => console.log(`   ${issue}`))

        // Kritische Probleme stoppen den Server
        const criticalIssues = productionIssues.filter(i => i.startsWith('❌'))
        if (criticalIssues.length > 0) {
          throw new Error('Kritische Production-Probleme gefunden. Server wird nicht gestartet.')
        }
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Startup Validation erfolgreich abgeschlossen')
    console.log('='.repeat(80) + '\n')

    return true
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ STARTUP VALIDATION FAILED')
    console.error('='.repeat(80))
    console.error(error)
    console.error('\n💡 Hilfe:')
    console.error('   1. Prüfe deine .env oder .env.local Datei')
    console.error('   2. Führe setup-env.ps1 aus um Secrets zu generieren')
    console.error('   3. Siehe .env.template für erforderliche Variablen')
    console.error('='.repeat(80) + '\n')

    // In Production MUSS der Server stoppen
    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    // In Development nur warnen
    return false
  }
}

/**
 * Startup Validation Hook für Next.js
 * Kann in instrumentation.ts oder server.ts aufgerufen werden
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await runStartupValidation()
  }
}
