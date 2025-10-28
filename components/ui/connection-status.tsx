'use client'

import { useSocket } from '@/components/providers/socket-provider'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RotateCcw } from 'lucide-react'

export function ConnectionStatus() {
  const { isConnected, connectionError, reconnectAttempts } = useSocket()

  if (isConnected) {
    return (
      <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50 border-green-200">
        <Wifi className="h-3 w-3" />
        Connected
      </Badge>
    )
  }

  if (reconnectAttempts > 0) {
    return (
      <Badge variant="secondary" className="gap-1 text-yellow-600 bg-yellow-50 border-yellow-200">
        <RotateCcw className="h-3 w-3 animate-spin" />
        Reconnecting... ({reconnectAttempts})
      </Badge>
    )
  }

  if (connectionError) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Disconnected
    </Badge>
  )
}