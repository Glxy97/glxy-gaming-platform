'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { GamingButton } from '@/components/ui/gaming-button'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

function FinishRegistrationContent() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const name = searchParams?.get('name')
  const email = searchParams?.get('email')
  const image = searchParams?.get('image')
  const provider = searchParams?.get('provider')

  useEffect(() => {
    if (name) {
      const suggestedUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 20)
      setUsername(suggestedUsername)
      checkUsername(suggestedUsername)
    }
  }, [name])

  if (!email) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <GamingCard variant="glass" className="p-8 text-center">
                <h2 className="text-2xl font-orbitron font-bold text-red-500">Fehler</h2>
                <p className="text-muted-foreground mt-2">
                    Wichtige Informationen für die Registrierung fehlen.
                </p>
                <Link href="/auth/signup">
                    <GamingButton className="mt-4">Zurück zur Registrierung</GamingButton>
                </Link>
            </GamingCard>
        </div>
    )
  }

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setIsAvailable(null)
      return
    }
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      const data = await response.json()
      setIsAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    // Debounce username check
    const check = setTimeout(() => {
        checkUsername(value)
    }, 300)
    return () => clearTimeout(check)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || username.length < 3 || isAvailable === false) {
      toast({
        title: 'Username nicht gültig',
        description: 'Bitte wähle einen verfügbaren Username mit mindestens 3 Zeichen.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/create-oauth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, name, image })
      })

      if (response.ok) {
        toast({
          title: 'Registrierung abgeschlossen!',
          description: 'Dein Account wurde erstellt. Du wirst jetzt eingeloggt.'
        })
        
        // Sign the user in using the original OAuth provider
        if (provider) {
            const result = await signIn(provider, { redirect: true, callbackUrl: '/dashboard' })
            if (result?.error) {
                throw new Error('Login failed after registration.')
            }
        } else {
            throw new Error('Provider not found.')
        }

      } else {
        const error = await response.json()
        toast({
          title: 'Fehler bei der Registrierung',
          description: error.message || 'Dein Account konnte nicht erstellt werden.',
          variant: 'destructive'
        })
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
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gaming-primary/10 via-gaming-secondary/5 to-gaming-accent/10 gaming-grid" />
      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-bold gradient-text mb-2">GLXY.AT</h1>
          </div>
          <GamingCard variant="glass" className="p-8">
            <GamingCardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gaming-primary/20 rounded-full flex items-center justify-center animate-glow">
                <Sparkles className="w-8 h-8 text-gaming-primary" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold">Registrierung abschließen</h2>
              <p className="text-muted-foreground mt-2">Nur noch ein Schritt! Wähle deinen einzigartigen Username.</p>
            </GamingCardHeader>
            <GamingCardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-primary w-5 h-5" />
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary transition-colors"
                      placeholder="wähle_deinen_namen"
                      maxLength={20}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {username.length >= 3 && isAvailable === true && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {username.length >= 3 && isAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-muted-foreground">3-20 Zeichen, nur Buchstaben, Zahlen und Unterstriche.</p>
                    {username.length >= 3 && isAvailable === true && <p className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Username verfügbar!</p>}
                    {username.length >= 3 && isAvailable === false && <p className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Username bereits vergeben.</p>}
                  </div>
                </div>
                <GamingButton type="submit" size="lg" glow disabled={isLoading || !username || username.length < 3 || isAvailable === false} className="w-full">
                  {isLoading ? <LoadingSpinner size="sm" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Registrierung abschließen</>}
                </GamingButton>
              </form>
            </GamingCardContent>
          </GamingCard>
        </motion.div>
      </div>
    </div>
  )
}

export default function FinishRegistrationPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <FinishRegistrationContent />
        </Suspense>
    )
}
