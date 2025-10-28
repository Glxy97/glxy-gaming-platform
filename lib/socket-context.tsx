'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import SocketManager from './socket-manager'
import type { ClientSocket, SocketAPI } from './socket-client'

export type SocketCtx = {
  socket: ClientSocket | null
  socketAPI: SocketAPI | null
  isConnected: boolean
  connectionError?: string | null
  reconnectAttempts: number
  connect: (userId: string) => void
  disconnect: () => void
}

const Ctx = createContext<SocketCtx | null>(null)

export function SocketProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const mgr = useMemo(() => SocketManager.getInstance(), [])
  const [state, setState] = useState<Omit<SocketCtx, 'connect' | 'disconnect'>>({
    socket: null,
    socketAPI: null,
    isConnected: false,
    connectionError: null,
    reconnectAttempts: 0,
  })

  useEffect(() => {
    const listener = (s: { socket: ClientSocket | null; socketAPI: SocketAPI | null; isConnected: boolean }) => {
      setState(prev => ({ ...prev, ...s }))
    }
    mgr.addListener(listener)
    mgr.connect(userId)

    return () => {
      mgr.removeListener(listener)
      // keine harte Disconnect-Policy im Unmount – je nach App ggf. behalten
    }
  }, [mgr, userId])

  const value: SocketCtx = {
    ...state,
    connect: (uid: string) => mgr.connect(uid),
    disconnect: () => mgr.disconnect(),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSocket() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSocket must be used within <SocketProvider>')
  return ctx
}
