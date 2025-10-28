'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Key, QrCode, CheckCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react'
import QRCode from 'qrcode'

interface MFASetupProps {
  onComplete?: () => void
  onCancel?: () => void
  isAdmin?: boolean
}

interface MFAData {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export default function MFASetup({ onComplete, onCancel, isAdmin = false }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup')
  const [mfaData, setMfaData] = useState<MFAData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCodeImage, setQrCodeImage] = useState('')

  useEffect(() => {
    if (step === 'setup') {
      initializeMFA()
    }
  }, [step])

  useEffect(() => {
    if (mfaData?.qrCodeUrl) {
      generateQRCode()
    }
  }, [mfaData])

  const initializeMFA = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setMfaData(data.data)
      } else {
        setError(data.error || 'Fehler beim Initialisieren der MFA')
      }
    } catch (error) {
      setError('Netzwerkfehler beim Initialisieren der MFA')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (!mfaData?.qrCodeUrl) return

    try {
      const qrDataUrl = await QRCode.toDataURL(mfaData.qrCodeUrl)
      setQrCodeImage(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const verifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Bitte geben Sie einen 6-stelligen Code ein')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationCode,
          secret: mfaData?.secret
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('backup')
      } else {
        setError(data.error || 'Ungültiger Verifikationscode')
      }
    } catch (error) {
      setError('Fehler bei der Verifikation')
    } finally {
      setLoading(false)
    }
  }

  const enableMFA = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: mfaData?.secret
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('complete')
        if (onComplete) {
          setTimeout(onComplete, 2000)
        }
      } else {
        setError(data.error || 'Fehler beim Aktivieren der MFA')
      }
    } catch (error) {
      setError('Fehler beim Aktivieren der MFA')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadBackupCodes = () => {
    if (!mfaData?.backupCodes) return

    const content = [
      'GLXY Gaming - MFA Backup Codes',
      '=' .repeat(35),
      'Diese Codes können jeweils nur einmal verwendet werden.',
      'Bewahren Sie sie an einem sicheren Ort auf.',
      '',
      ...mfaData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generiert am: ${new Date().toLocaleString()}`
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `glxy-gaming-mfa-backup-${Date.now()}.txt`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/90 border border-gray-700 rounded-lg max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-orbitron font-bold mb-2">
            Multi-Faktor-Authentifizierung
          </h2>
          <p className="text-muted-foreground">
            Erhöhen Sie die Sicherheit Ihres Kontos
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            {['setup', 'verify', 'backup', 'complete'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === stepName ? 'bg-blue-500 text-white' :
                  ['setup', 'verify', 'backup', 'complete'].indexOf(step) > index ? 'bg-green-500 text-white' :
                  'bg-gray-600 text-gray-400'
                }`}>
                  {['setup', 'verify', 'backup', 'complete'].indexOf(step) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ${
                    ['setup', 'verify', 'backup', 'complete'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Setup Step */}
        {step === 'setup' && mfaData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">1. QR-Code scannen</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Verwenden Sie eine Authenticator-App wie Google Authenticator, Authy oder ähnliche
              </p>

              {qrCodeImage && (
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src={qrCodeImage} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-4">
                <p>Können Sie den QR-Code nicht scannen?</p>
                <p>Geben Sie diesen Schlüssel manuell ein:</p>
                <div className="bg-gray-800 p-2 rounded mt-2 font-mono text-xs break-all flex items-center justify-between">
                  <span>{mfaData.secret}</span>
                  <button
                    onClick={() => copyToClipboard(mfaData.secret)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              Weiter zur Verifikation
            </button>
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">2. Code eingeben</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
              </p>

              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setVerificationCode(value)
                  setError('')
                }}
                className="w-full px-4 py-3 text-center text-2xl font-mono bg-gray-800 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
              >
                Zurück
              </button>
              <button
                onClick={verifyMFA}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Verifizieren'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && mfaData?.backupCodes && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">3. Backup-Codes speichern</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Diese Codes können verwendet werden, wenn Sie keinen Zugriff auf Ihr Authenticator-Gerät haben.
                Jeder Code kann nur einmal verwendet werden.
              </p>

              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {mfaData.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span>{code}</span>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={downloadBackupCodes}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium mb-4"
              >
                Backup-Codes herunterladen
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('verify')}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
              >
                Zurück
              </button>
              <button
                onClick={enableMFA}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'MFA aktivieren'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">MFA erfolgreich aktiviert!</h3>
            <p className="text-muted-foreground">
              Ihr Konto ist jetzt durch Multi-Faktor-Authentifizierung geschützt.
              Sie werden beim nächsten Login nach einem Code gefragt.
            </p>
            <button
              onClick={onComplete}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              Fertig
            </button>
          </div>
        )}

        {/* Cancel Button (only show in setup/verify steps) */}
        {(step === 'setup' || step === 'verify') && onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
        )}
      </motion.div>
    </div>
  )
}