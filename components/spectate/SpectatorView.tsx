'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/lib/socket-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Eye, Users, Clock, Trophy, MessageCircle, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SpectatorViewProps {
  roomId: string
  initialRoomData?: any
}

export function SpectatorView({ roomId, initialRoomData }: SpectatorViewProps) {
  const [roomData, setRoomData] = useState(initialRoomData)
  const [isConnected, setIsConnected] = useState(false)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [gameEvents, setGameEvents] = useState<any[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    if (socket && roomId) {
      // Join as spectator
      socket.emit('spectate_room', { roomId })

      // Listen for room updates
      socket.on('room_updated', (data) => {
        setRoomData(data.room)
        setSpectatorCount(data.room.spectators?.length || 0)
      })

      // Listen for game events
      socket.on('game_event', (event) => {
        setGameEvents(prev => [...prev.slice(-19), {
          ...event,
          timestamp: new Date().toISOString()
        }])

        // Play sound for important events
        if (soundEnabled && ['move', 'capture', 'checkmate', 'game_end'].includes(event.type)) {
          playEventSound(event.type)
        }
      })

      // Listen for player moves/actions
      socket.on('game_state_updated', (gameState) => {
        setRoomData(prev => prev ? { ...prev, gameState } : null)
      })

      socket.on('spectator_joined', (data) => {
        setSpectatorCount(data.spectatorCount)
      })

      socket.on('spectator_left', (data) => {
        setSpectatorCount(data.spectatorCount)
      })

      setIsConnected(true)

      return () => {
        socket.emit('leave_spectate', { roomId })
        socket.off('room_updated')
        socket.off('game_event')
        socket.off('game_state_updated')
        socket.off('spectator_joined')
        socket.off('spectator_left')
      }
    }
    
    // Return cleanup function even when socket is not connected
    return () => {}
  }, [socket, roomId, soundEnabled])

  const playEventSound = (eventType: string) => {
    // Simple audio feedback for events
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // Different tones for different events
    switch (eventType) {
      case 'move':
        oscillator.frequency.setValueAtTime(440, context.currentTime)
        break
      case 'capture':
        oscillator.frequency.setValueAtTime(660, context.currentTime)
        break
      case 'checkmate':
      case 'game_end':
        oscillator.frequency.setValueAtTime(880, context.currentTime)
        break
    }

    gainNode.gain.setValueAtTime(0, context.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.3)
  }

  if (!roomData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gaming-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Spielraum...</p>
        </div>
      </div>
    )
  }

  const { gameState, players, spectators } = roomData

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-gaming-primary" />
              <div>
                <CardTitle className="text-xl">{roomData.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {roomData.gameType.toUpperCase()} • Zuschauermodus
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {spectatorCount} Zuschauer
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Live Spiel
                {isConnected && (
                  <Badge variant="default" className="bg-green-500 text-white">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Game-specific rendering would go here */}
              {roomData.gameType === 'chess' && gameState && (
                <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border-2 border-amber-200 dark:border-amber-800 p-4">
                  <div className="text-center text-muted-foreground">
                    Schachbrett wird geladen...
                    <br />
                    <small>Zug {gameState.moveCount || 0}</small>
                  </div>
                </div>
              )}

              {roomData.gameType === 'racing' && (
                <div className="aspect-video bg-gradient-to-b from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  Racing Track Spectator View
                </div>
              )}

              {/* Players Info */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player: any, index: number) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      gameState?.currentPlayer === player.id
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{player.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.score !== undefined && `Score: ${player.score}`}
                        {player.rating && ` • Rating: ${player.rating}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Live Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {gameEvents.slice(-10).reverse().map((event, index) => (
                    <motion.div
                      key={`${event.timestamp}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-2 bg-background/50 rounded text-sm border-l-2 border-gaming-primary/50"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{event.type}</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p>{event.description || `${event.type} event occurred`}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {gameEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Warte auf Spielereignisse...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spectators List */}
          {spectators && spectators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Andere Zuschauer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {spectators.map((spectator: any) => (
                    <div key={spectator.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{spectator.username}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Stats */}
          {gameState && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Spiel Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline">{roomData.status}</Badge>
                </div>
                {gameState.startTime && (
                  <div className="flex justify-between">
                    <span>Spielzeit:</span>
                    <span>{Math.floor((Date.now() - new Date(gameState.startTime).getTime()) / 1000 / 60)}m</span>
                  </div>
                )}
                {gameState.moveCount !== undefined && (
                  <div className="flex justify-between">
                    <span>Züge:</span>
                    <span>{gameState.moveCount}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}