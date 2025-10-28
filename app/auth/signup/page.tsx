
'use client'

import { useState , useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Sparkles, Github, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { validatePassword, getPasswordStrengthIndicator, getPasswordRequirements } from '@/lib/password-validator'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // Real-time Password Validation
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordErrors(validation.errors)
    } else {
      setPasswordErrors([])
    }
  }, [password])

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (oauthLoading) return // Verhindere mehrfaches Klicken

    setOauthLoading(provider)

    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/'
      })

      if (result?.error) {
        toast({
          title: 'Registrierung fehlgeschlagen',
          description: `Fehler bei der ${provider === 'google' ? 'Google' : 'GitHub'}-Registrierung.`,
          variant: 'destructive'
        })
      } else if (result?.url) {
        // Erfolgreiche OAuth-Registrierung
        window.location.href = result.url
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      })
    } finally {
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwort-Fehler',
        description: 'Die PasswÃ¶rter stimmen nicht Ã¼berein.',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Passwort zu kurz',
        description: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Registrierung fehlgeschlagen',
          description: data.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Registrierung erfolgreich! 📧',
        description: data.emailSent ?
          'Willkommens-E-Mail gesendet! Bitte bestätige deine E-Mail-Adresse.' :
          'Account erstellt! Bitte kontaktiere uns für die E-Mail-Verifikation.'
      })

      // Show success message and redirect info
      setTimeout(() => {
        toast({
          title: '📬 E-Mail prüfen!',
          description: 'Schaue in deinen Posteingang (auch Spam-Ordner) für die Bestätigungs-E-Mail.'
        })
      }, 3000)

      // Redirect to sign in page
      setTimeout(() => {
        router.push('/auth/signin')
      }, 8000)

    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/10 via-gaming-secondary/5 to-gaming-accent/10" />
        <div className="absolute inset-0 gaming-grid" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-orbitron font-bold gradient-text mb-2 hover:scale-105 transition-transform">
                GLXY.AT
              </h1>
            </Link>
            <p className="text-muted-foreground">Tritt der Gaming-Community bei</p>
          </div>

          <GamingCard variant="glass" className="p-8">
            <GamingCardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gaming-primary/20 rounded-full flex items-center justify-center animate-glow">
                <Sparkles className="w-8 h-8 text-gaming-primary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold">Registrieren</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Erstelle deinen GLXY-Account und starte dein Gaming-Abenteuer
              </p>
            </GamingCardHeader>

            <GamingCardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="deine@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Benutzername</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="DeinUsername"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="Mindestens 6 Zeichen"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gaming-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Passwort bestätigen</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="Passwort wiederholen"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gaming-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <GamingButton
                  type="submit"
                  size="lg"
                  glow
                  disabled={isLoading}
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Account erstellen
                    </>
                  )}
                </GamingButton>
              </form>

              {/* OAuth Provider Buttons */}
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">oder</span>
                  </div>
                </div>

                {/* Google Registration Button */}
                <GamingButton
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === 'google' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Mit Google registrieren
                    </>
                  )}
                </GamingButton>

                {/* GitHub Registration Button */}
                <GamingButton
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === 'github' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Github className="w-5 h-5 mr-2" />
                      Mit GitHub registrieren
                    </>
                  )}
                </GamingButton>
              </div>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Bereits einen Account?{' '}
                  <Link
                    href="/auth/signin"
                    className="text-gaming-primary hover:text-gaming-primary/80 font-medium transition-colors"
                  >
                    Hier anmelden
                  </Link>
                </p>
              </div>
            </GamingCardContent>
          </GamingCard>
        </motion.div>
      </div>
    </div>
  )
}
