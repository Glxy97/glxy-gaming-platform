"use client"
export function GridBackground({ className = '' }: { className?: string }) {
  return <div className={`fixed inset-0 gaming-grid opacity-30 ${className}`} aria-hidden />
}

