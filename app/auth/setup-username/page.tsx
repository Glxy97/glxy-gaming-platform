'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Sparkles } from 'lucide-react'

export default function SetupUsernamePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  // Redirect if already has username
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.username) {
      router.push('/profile')
    }
  }, [session, status, router])

  // Check username availability
  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) return

    setIsChecking(true)
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameToCheck })
      })

      const data = await response.json()

      if (!data.available) {
        setError('Benutzername ist bereits vergeben')
      } else {
        setError('')
      }
    } catch (err) {
      console.error('Error checking username:', err)
    } finally {
      setIsChecking(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setError('')

    // Debounce availability check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (skipSetup = false) => {
    if (!skipSetup && !username.trim()) {
      setError('Bitte geben Sie einen Benutzernamen ein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/setup-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: skipSetup ? null : username.trim(),
          skipSetup
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten')
        return
      }

      // Update session
      await update()

      // Redirect to profile
      router.push('/profile')
    } catch (err) {
      console.error('Error setting username:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gaming-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-gaming-dark to-black">
      <Card className="w-full max-w-md border-gaming-primary/20 bg-black/80 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gaming-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-gaming-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-gaming-primary to-gaming-secondary bg-clip-text text-transparent">
            Benutzername wählen
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Wählen Sie einen eindeutigen Benutzernamen für Ihr Profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="z.B. GamingHero4782"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={isLoading}
                className="pr-10"
                maxLength={20}
              />
              {isChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gaming-primary" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 Zeichen, nur Buchstaben, Zahlen und Unterstrich
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isLoading || !username.trim() || !!error || isChecking}
              className="w-full bg-gaming-primary hover:bg-gaming-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                'Benutzername speichern'
              )}
            </Button>

            <Button
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              variant="outline"
              className="w-full border-gaming-primary/30 hover:bg-gaming-primary/10"
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Zufälligen Namen generieren
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Sie können Ihren Benutzernamen später in Ihren Profileinstellungen ändern
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
