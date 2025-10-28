'use client'

import { useMemo } from 'react'
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getPasswordStrengthIndicator, getPasswordRequirements } from '@/lib/password-validator'

interface PasswordStrengthIndicatorProps {
  password: string
  errors: string[]
}

export function PasswordStrengthIndicator({ password, errors }: PasswordStrengthIndicatorProps) {
  const strengthIndicator = useMemo(() => {
    if (!password) return null
    return getPasswordStrengthIndicator(password)
  }, [password])

  const requirements = useMemo(() => getPasswordRequirements(), [])

  if (!password) {
    return (
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Passwort-Anforderungen</span>
        </div>
        <ul className="space-y-1">
          {requirements.map((req, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const isWeak = strengthIndicator?.strength === 'weak'
  const isMedium = strengthIndicator?.strength === 'medium'
  const isStrong = strengthIndicator?.strength === 'strong'

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Passwort-Stärke
          </span>
          <span className={`text-xs font-medium ${
            isStrong ? 'text-green-500' :
            isMedium ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {strengthIndicator?.text}
          </span>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthIndicator?.color}`}
            style={{ width: `${strengthIndicator?.percentage}%` }}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-1 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Probleme gefunden:</span>
          </div>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-400 flex items-start gap-2">
                <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {errors.length === 0 && isStrong && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Sicheres Passwort! ✓</span>
        </div>
      )}
    </div>
  )
}
