import nodemailer from 'nodemailer'
import crypto from 'crypto'

// SMTP-Konfiguration
const createTransporter = () => {
  try {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true für 465, false für andere Ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } catch (error) {
    console.warn('Email transporter creation failed:', error)
    return null
  }
}

// Generiere sicheren Verifikations-Token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Erstelle Verifikations-URL
export const createVerificationUrl = (token: string): string => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/verify-email?token=${token}`
}

// Sende Willkommens-E-Mail mit Verifikation
export const sendWelcomeEmail = async (
  email: string,
  username: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email service unavailable - transporter not created')
      return false
    }

    const verificationUrl = createVerificationUrl(verificationToken)

    const mailOptions = {
      from: `"GLXY Gaming Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎮 Willkommen bei GLXY Gaming - E-Mail bestätigen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Willkommen bei GLXY Gaming</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 15px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .welcome-text {
              font-size: 18px;
              color: #666;
              margin-bottom: 30px;
            }
            .verify-button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
              transition: transform 0.2s;
            }
            .verify-button:hover {
              transform: translateY(-2px);
            }
            .features {
              background: #f8f9fa;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
            }
            .feature {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
            }
            .feature-icon {
              font-size: 24px;
              margin-right: 15px;
            }
            .footer {
              text-align: center;
              color: #888;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .security-note {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GLXY.AT</div>
              <h1>Willkommen, ${username}! 🎮</h1>
              <p class="welcome-text">
                Schön, dass du dabei bist! Dein Gaming-Abenteuer kann beginnen.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p>Um deinen Account zu aktivieren, bestätige bitte deine E-Mail-Adresse:</p>
              <a href="${verificationUrl}" class="verify-button">
                ✅ E-Mail bestätigen
              </a>
            </div>

            <div class="features">
              <h3>🚀 Was dich bei GLXY erwartet:</h3>
              <div class="feature">
                <span class="feature-icon">♟️</span>
                <div>
                  <strong>Strategisches Schach</strong><br>
                  Spiele gegen Spieler aus aller Welt
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🏎️</span>
                <div>
                  <strong>Rasante Racing-Games</strong><br>
                  Zeige allen, wer der schnellste Fahrer ist
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🃏</span>
                <div>
                  <strong>UNO & Kartenspiele</strong><br>
                  Spiele klassische Kartenspiele mit Freunden
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🎯</span>
                <div>
                  <strong>FPS-Action</strong><br>
                  Intensive Shooter-Matches für Adrenalin-Junkies
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🏆</span>
                <div>
                  <strong>Achievements & Levels</strong><br>
                  Sammle XP, steige auf und schalte Belohnungen frei
                </div>
              </div>
            </div>

            <div class="security-note">
              <strong>🔐 Sicherheitshinweis:</strong><br>
              Diese E-Mail wurde an ${email} gesendet. Falls du dich nicht bei GLXY registriert hast, ignoriere diese E-Mail einfach.
            </div>

            <div class="footer">
              <p>
                <strong>GLXY Gaming Platform</strong><br>
                Deine ultimative Gaming-Community<br>
                <a href="${process.env.NEXTAUTH_URL || 'https://glxy.at'}">glxy.at</a>
              </p>
              <p style="font-size: 12px; color: #aaa; margin-top: 15px;">
                Diese Verifikations-E-Mail ist 24 Stunden gültig.<br>
                Falls der Button nicht funktioniert, kopiere diesen Link: ${verificationUrl}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Willkommen bei GLXY Gaming, ${username}!

        Schön, dass du dabei bist! Um deinen Account zu aktivieren, bestätige bitte deine E-Mail-Adresse:

        Verifikations-Link: ${verificationUrl}

        Was dich bei GLXY erwartet:
        ♟️ Strategisches Schach - Spiele gegen Spieler aus aller Welt
        🏎️ Rasante Racing-Games - Zeige allen, wer der schnellste Fahrer ist
        🃏 UNO & Kartenspiele - Spiele klassische Kartenspiele mit Freunden
        🎯 FPS-Action - Intensive Shooter-Matches für Adrenalin-Junkies
        🏆 Achievements & Levels - Sammle XP, steige auf und schalte Belohnungen frei

        Sicherheitshinweis:
        Diese E-Mail wurde an ${email} gesendet. Falls du dich nicht bei GLXY registriert hast, ignoriere diese E-Mail einfach.

        Diese Verifikations-E-Mail ist 24 Stunden gültig.

        GLXY Gaming Platform - Deine ultimative Gaming-Community
        ${process.env.NEXTAUTH_URL || 'https://glxy.at'}
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Willkommens-E-Mail gesendet:', info.messageId)
    return true

  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail:', error)
    return false
  }
}

// Sende Erinnerungs-E-Mail für nicht verifizierte Accounts
export const sendReminderEmail = async (
  email: string,
  username: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email service unavailable - transporter not created')
      return false
    }

    const verificationUrl = createVerificationUrl(verificationToken)

    const mailOptions = {
      from: `"GLXY Gaming Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎮 GLXY Gaming - Erinnerung: E-Mail bestätigen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hallo ${username}!</h1>
          <p>Du hast dich vor kurzem bei GLXY Gaming registriert, aber deine E-Mail-Adresse noch nicht bestätigt.</p>
          <p>Um deinen Account zu aktivieren und loszuspielen, bestätige bitte deine E-Mail:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">
              E-Mail jetzt bestätigen
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Falls der Button nicht funktioniert, kopiere diesen Link: ${verificationUrl}
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log('✅ Erinnerungs-E-Mail gesendet')
    return true

  } catch (error) {
    console.error('❌ Fehler beim Senden der Erinnerungs-E-Mail:', error)
    return false
  }
}

// Sende Passwort-Reset-E-Mail
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  resetToken: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email service unavailable - transporter not created')
      return false
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    const mailOptions = {
      from: `"GLXY Gaming Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔒 GLXY Gaming - Passwort zurücksetzen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Passwort zurücksetzen</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 15px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .reset-button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
            }
            .security-warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              text-align: center;
              color: #888;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GLXY.AT</div>
              <h1>Passwort zurücksetzen 🔒</h1>
            </div>

            <p>Hallo ${username},</p>

            <p>du hast eine Passwort-Zurücksetzung für dein GLXY Gaming Konto angefordert.</p>

            <p>Klicke auf den Button unten, um ein neues Passwort zu erstellen:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">
                🔑 Neues Passwort erstellen
              </a>
            </div>

            <div class="security-warning">
              <h3>⚠️ Sicherheitshinweis:</h3>
              <ul>
                <li>Dieser Link ist nur <strong>1 Stunde</strong> gültig</li>
                <li>Falls du keine Passwort-Zurücksetzung angefordert hast, ignoriere diese E-Mail</li>
                <li>Teile diesen Link niemals mit anderen</li>
              </ul>
            </div>

            <div class="footer">
              <p>
                Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                <a href="${resetUrl}">${resetUrl}</a>
              </p>
              <p>
                GLXY Gaming Platform - Deine ultimative Gaming-Community<br>
                <a href="${process.env.NEXTAUTH_URL || 'https://glxy.at'}">glxy.at</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Passwort zurücksetzen - GLXY Gaming

        Hallo ${username},

        du hast eine Passwort-Zurücksetzung für dein GLXY Gaming Konto angefordert.

        Klicke auf diesen Link, um ein neues Passwort zu erstellen:
        ${resetUrl}

        Sicherheitshinweis:
        - Dieser Link ist nur 1 Stunde gültig
        - Falls du keine Passwort-Zurücksetzung angefordert hast, ignoriere diese E-Mail
        - Teile diesen Link niemals mit anderen

        GLXY Gaming Platform
        ${process.env.NEXTAUTH_URL || 'https://glxy.at'}
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Passwort-Reset-E-Mail gesendet:', info.messageId)
    return true

  } catch (error) {
    console.error('❌ Fehler beim Senden der Passwort-Reset-E-Mail:', error)
    return false
  }
}

// Sende Verifikations-E-Mail (vereinfacht)
export const sendVerificationEmail = async (
  email: string,
  username: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email service unavailable - transporter not created')
      return false
    }

    const verificationUrl = createVerificationUrl(verificationToken)

    const mailOptions = {
      from: `"GLXY Gaming Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '📧 GLXY Gaming - E-Mail-Adresse verifizieren',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>E-Mail verifizieren</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 15px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .verify-button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .footer {
              color: #888;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">GLXY.AT</div>
            <h1>E-Mail verifizieren 📧</h1>

            <p>Hallo ${username}!</p>

            <p>Bitte verifiziere deine E-Mail-Adresse, um dein GLXY Gaming Konto zu aktivieren.</p>

            <a href="${verificationUrl}" class="verify-button">
              ✅ E-Mail verifizieren
            </a>

            <div class="footer">
              <p>Dieser Verifizierungslink ist 24 Stunden gültig.</p>
              <p>
                GLXY Gaming Platform<br>
                <a href="${process.env.NEXTAUTH_URL || 'https://glxy.at'}">glxy.at</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Verifikations-E-Mail gesendet:', info.messageId)
    return true

  } catch (error) {
    console.error('❌ Fehler beim Senden der Verifikations-E-Mail:', error)
    return false
  }
}

// Test E-Mail-Verbindung
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email transporter not available')
      return false
    }

    await transporter.verify()
    console.log('✅ SMTP-Verbindung erfolgreich')
    return true
  } catch (error) {
    console.error('❌ SMTP-Verbindung fehlgeschlagen:', error)
    return false
  }
}