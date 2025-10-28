'use client'

import { Dialog, DialogTrigger, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import React from 'react'
import { InviteUserForm } from './InviteUserForm'

type Props = { roomId: string; triggerClassName?: string }

export function InviteUserDialog({ roomId, triggerClassName }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={triggerClassName || 'bg-purple-600 text-white px-3 py-1 rounded'}>
          Spieler einladen
        </button>
      </DialogTrigger>
      <DialogOverlay />
      <DialogContent>
          <DialogTitle className="font-semibold mb-1">Spieler einladen</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mb-3">
            Suche nach Username und sende eine Einladung in diesen Raum.
          </DialogDescription>
          <InviteUserForm roomId={roomId} />
          <div className="flex justify-end mt-3">
            <DialogClose asChild>
              <button className="border px-3 py-1 rounded">Schließen</button>
            </DialogClose>
          </div>
      </DialogContent>
    </Dialog>
  )
}
