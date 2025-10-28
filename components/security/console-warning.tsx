"use client"

import { useEffect } from 'react'

export function ConsoleSecurityWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    try {
      // Prominent Warnhinweise gegen Self‑XSS in der Konsole
      // Keine technischen Sperren, aber Aufklärung für Nutzer
      // (verhindert, dass Angreifer Code zum Einfügen anlocken)
      // eslint-disable-next-line no-console
      console.log('%cAchtung!', 'color:#ef4444;font-size:32px;font-weight:bold;')
      // eslint-disable-next-line no-console
      console.log(
        '%cBitte hier keinen Code einfügen. Angreifer könnten versuchen, Ihre Daten zu stehlen.',
        'color:#f59e0b;font-size:14px;'
      )
    } catch {}
  }, [])
  return null
}

