'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import SocketManager, { type ListenerPayload } from '@/lib/socket-manager'
import { getSettings } from '@/lib/config'

type Ctx = {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}

const SocketContext = createContext<Ctx>({
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
})

type Props = {
  children: ReactNode
  /** Falls du später eine echte User-ID hast, hier durchreichen */
  userId?: string
  settings?: any
}

export function SocketProvider({ children, userId, settings }: Props) {
  const managerRef = useRef<SocketManager | null>(null)
  const [state, setState] = useState<Ctx>({
    socket: null,
    isConnected: false,
    connectionError: null,
    reconnectAttempts: 0,
  })

  useEffect(() => {
    const manager = SocketManager.getInstance()
    managerRef.current = manager

    const handleUpdate = (snap: ListenerPayload) => {
      setState({
        socket: snap.socket ?? null,
        isConnected: snap.isConnected,
        connectionError: snap.connectionError,
        reconnectAttempts: snap.reconnectAttempts,
      })
    }

    manager.addListener(handleUpdate)
    manager.connect(userId ?? 'anonymous')

    return () => {
      manager.removeListener(handleUpdate)
      // Optional: nicht disconnecten, wenn du persistente Verbindung willst
      // manager.disconnect()
    }
    // userId als Dependency, damit bei Userwechsel neuer Connect erfolgt
  }, [userId])

  const value = useMemo<Ctx>(() => state, [state])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
