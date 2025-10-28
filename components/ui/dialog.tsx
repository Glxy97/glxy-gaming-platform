"use client"
import * as DialogPrimitive from '@radix-ui/react-dialog'
import React from 'react'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogOverlay(props: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay {...props} className={(props.className || '') + ' fixed inset-0 bg-black/50 z-50'} />
}

export function DialogContent({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Content
      {...props}
      className={[
        'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'bg-card text-foreground border border-border rounded-xl shadow-xl p-4',
        'w-[90vw] max-w-md focus:outline-none',
        className || ''
      ].join(' ')}
    />
  )
}

export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close

// Minimal shims for older shadcn usage expecting DialogHeader/Footer
// These keep existing imports working without pulling new UI code.
export function DialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return (
    <div
      className={[
        'flex flex-col space-y-1.5 text-left',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

export function DialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return (
    <div
      className={[
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}
