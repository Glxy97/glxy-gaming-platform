'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React, { useState } from 'react'
import { InviteUserForm } from './InviteUserForm'
import { Dialog, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'

type Props = { roomId: string }

export function RoomMenu({ roomId }: Props) {
  const [openInvite, setOpenInvite] = useState(false)
  return (
    <div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="border rounded px-2 py-1">⋮</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="bg-card text-foreground border border-border rounded shadow p-1 min-w-[180px]">
            <DropdownMenu.Item className="px-2 py-1 text-sm rounded hover:bg-gray-50" onSelect={() => { navigator.clipboard.writeText(roomId) }}>
              Raum-ID kopieren
            </DropdownMenu.Item>
            <DropdownMenu.Item className="px-2 py-1 text-sm rounded hover:bg-gray-50" onSelect={() => setOpenInvite(true)}>
              Spieler einladen…
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog open={openInvite} onOpenChange={setOpenInvite}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle className="font-semibold mb-1">Spieler einladen</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mb-3">Suche nach Username und sende eine Einladung.</DialogDescription>
          <InviteUserForm roomId={roomId} />
          <div className="flex justify-end mt-3">
            <DialogClose asChild>
              <button className="border px-3 py-1 rounded">Schließen</button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
