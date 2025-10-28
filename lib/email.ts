import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const createTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ SMTP credentials not configured - emails will not be sent')
    return null
  }

  return nodemailer.createTransporter(emailConfig)
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      console.log('📧 Email service not configured - would send:', {
        to: options.to,
        subject: options.subject
      })
      return false
    }

    const info = await transporter.sendMail({
      from: `"GLXY Gaming Platform" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

export function generateVerificationEmail(username: string, verificationUrl: string): EmailOptions {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Mail-Verifikation - GLXY Gaming</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { line-height: 1.6; color: #333; }
        .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 GLXY Gaming Platform</div>
        </div>

        <div class="content">
          <h2>Willkommen bei GLXY Gaming, ${username}!</h2>

          <p>Vielen Dank für deine Registrierung bei der GLXY Gaming Platform. Um dein Konto zu aktivieren und mit dem Spielen zu beginnen, musst du deine E-Mail-Adresse verifizieren.</p>

          <p>Klicke einfach auf den folgenden Button:</p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">E-Mail-Adresse bestätigen</a>
          </div>

          <p>Oder kopiere diesen Link in deinen Browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

          <p><strong>Wichtige Informationen:</strong></p>
          <ul>
            <li>Dieser Verifikationslink ist 24 Stunden gültig</li>
            <li>Du kannst dich erst nach der Verifikation anmelden</li>
            <li>Falls du diese E-Mail nicht angefordert hast, ignoriere sie einfach</li>
          </ul>

          <p>Wir freuen uns darauf, dich in der GLXY Gaming Community zu begrüßen!</p>
        </div>

        <div class="footer">
          <p>Das GLXY Gaming Team<br>
          <a href="https://glxy.at">glxy.at</a></p>

          <p style="font-size: 12px;">Falls du Probleme mit dem Button hast, kopiere den Link manuell in deinen Browser. Bei weiteren Fragen kontaktiere unseren Support.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Willkommen bei GLXY Gaming, ${username}!

Vielen Dank für deine Registrierung. Um dein Konto zu aktivieren, verifiziere deine E-Mail-Adresse:

${verificationUrl}

Dieser Link ist 24 Stunden gültig. Du kannst dich erst nach der Verifikation anmelden.

Falls du diese E-Mail nicht angefordert hast, ignoriere sie einfach.

Das GLXY Gaming Team
https://glxy.at
  `

  return {
    to: '',
    subject: 'E-Mail-Verifikation - GLXY Gaming Platform',
    html,
    text
  }
}