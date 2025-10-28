/**
 * Web-Adobe Layout
 * Client-side only layout to prevent SSR issues with PDF.js
 */

'use client'

import { ReactNode } from 'react'

export default function WebAdobeLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
