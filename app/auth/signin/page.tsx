
'use client'

import { useState , useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff, Gamepad2, Github } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [totp, setTotp] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session, status } = useSession()

  // Check if user is already logged in and needs username setup
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (!(session.user as any).needsUsernameSetup && session.user.username) {
        router.push('/dashboard')
      } else if ((session.user as any).needsUsernameSetup) {
        router.push('/auth/setup-username')
      }
    }
  }, [status, session, router])

  // Check for OAuth errors
  useEffect(() => {
    const error = searchParams?.get('error')
    if (error) {
      let errorMessage = 'Ein Fehler ist bei der Anmeldung aufgetreten.'

      switch (error) {
        case 'OAuthSignin':
          errorMessage = 'Fehler beim OAuth-Anbieter. Bitte versuche es erneut.'
          break
        case 'OAuthCallback':
          errorMessage = 'OAuth-Callback-Fehler. Überprüfe deine Internetverbindung.'
          break
        case 'OAuthCreateAccount':
          errorMessage = 'Fehler beim Erstellen des Accounts. Bitte versuche es erneut.'
          break
        case 'EmailCreateAccount':
          errorMessage = 'Diese E-Mail-Adresse ist bereits registriert.'
          break
        case 'Configuration':
          errorMessage = 'Server-Konfigurationsfehler. Bitte versuche es später erneut.'
          break
        default:
          errorMessage = `OAuth-Fehler: ${error}`
      }

      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [searchParams, toast])

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (oauthLoading) return // Verhindere mehrfaches Klicken

    setOauthLoading(provider)

    try {
      // Für OAuth Provider sollten wir direkt redirecten lassen
      await signIn(provider, {
        callbackUrl: '/auth/signin' // Nach OAuth zurück zur Signin-Seite für Redirect-Logic
      })
    } catch (error) {
      console.error('OAuth Sign-in error:', error)
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      })
      setOauthLoading(null)
    }
    // Kein finally hier, da wir bei erfolgreichem OAuth redirected werden
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        // @ts-ignore
        totp: totp || undefined,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('MFA')) {
          setMfaRequired(true)
          toast({
            title: 'Zwei‑Faktor erforderlich',
            description: 'Bitte gib den Code aus deiner Authenticator‑App ein.',
          })
          return
        }
        toast({
          title: 'Anmeldung fehlgeschlagen',
          description: 'UngÃ¼ltige E-Mail oder Passwort.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Erfolgreich angemeldet!',
          description: 'Willkommen zurÃ¼ck bei GLXY!'
        })
        router.push('/')
      }
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
            <p className="text-muted-foreground">Melde dich bei deinem Account an</p>
          </div>

          <GamingCard variant="glass" className="p-8">
            <GamingCardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gaming-primary/20 rounded-full flex items-center justify-center">
                <LogIn className="w-8 h-8 text-gaming-primary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold">Anmelden</h2>
            </GamingCardHeader>

            <GamingCardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <label className="block text-sm font-medium mb-2">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="Dein Passwort"
                      required
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

                {(mfaRequired || totp) && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Zwei‑Faktor‑Code</label>
                    <div className="relative">
                      <input
                        inputMode="numeric"
                        value={totp}
                        onChange={(e) => setTotp(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                        placeholder="123 456"
                      />
                    </div>
                  </div>
                )}

                <GamingButton
                  type="submit"
                  size="lg"
                  glow
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Anmelden
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

                {/* Google Login Button */}
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
                      Mit Google anmelden
                    </>
                  )}
                </GamingButton>

                {/* GitHub Login Button */}
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
                      Mit GitHub anmelden
                    </>
                  )}
                </GamingButton>
              </div>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Noch keinen Account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-gaming-primary hover:text-gaming-primary/80 font-medium transition-colors"
                  >
                    Jetzt registrieren
                  </Link>
                </p>
              </div>
            </GamingCardContent>
          </GamingCard>

          {/* Demo Accounts Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <GamingCard variant="default" className="p-4">
              <div className="text-center">
                <Gamepad2 className="w-6 h-6 text-gaming-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2 text-foreground">Demo-Accounts</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>ChessKing:</strong> gamer1@glxy.at / demo123</p>
                  <p><strong>GameMaster:</strong> gamer2@glxy.at / demo123</p>
                  <p><strong>RookiePlayer:</strong> gamer3@glxy.at / demo123</p>
                </div>
              </div>
            </GamingCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
