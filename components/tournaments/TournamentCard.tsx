'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Coins,
  Lock,
  Star,
  Eye,
  UserPlus,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  description?: string
  gameType: string
  maxParticipants: number
  participantCount: number
  entryFee?: number
  prizePool?: number
  startDate: string
  endDate: string
  format: string
  status: string
  isPrivate: boolean
  creator: {
    id: string
    username: string
    avatar?: string
  }
  canJoin: boolean
  timeUntilStart: number
}

interface TournamentCardProps {
  tournament: Tournament
  isParticipating?: boolean
  onJoin?: (tournamentId: string, password?: string) => void
  onLeave?: (tournamentId: string) => void
  onView?: (tournamentId: string) => void
}

export function TournamentCard({
  tournament,
  isParticipating,
  onJoin,
  onLeave,
  onView
}: TournamentCardProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500'
      case 'active':
        return 'bg-green-500'
      case 'completed':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'chess':
        return '♔'
      case 'racing':
        return '🏎️'
      case 'uno':
        return '🃏'
      case 'fps':
        return '🎯'
      default:
        return '🎮'
    }
  }

  const formatTimeUntil = (ms: number) => {
    if (ms <= 0) return 'Started'

    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleJoin = async () => {
    if (!onJoin) return

    setIsLoading(true)
    try {
      await onJoin(tournament.id, password)
      setShowJoinDialog(false)
      setPassword('')
    } catch (error) {
      console.error('Join tournament error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!onLeave) return

    setIsLoading(true)
    try {
      await onLeave(tournament.id)
    } catch (error) {
      console.error('Leave tournament error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const participationProgress = (tournament.participantCount / tournament.maxParticipants) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full border-2 hover:border-gaming-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getGameTypeIcon(tournament.gameType)}</span>
                <CardTitle className="text-lg line-clamp-1">{tournament.name}</CardTitle>
                {tournament.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={`${getStatusColor(tournament.status)} text-white`}>
                  {tournament.status.toUpperCase()}
                </Badge>
                <Badge variant="outline">{tournament.format.replace('_', ' ').toUpperCase()}</Badge>
              </div>

              {tournament.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {tournament.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Participation Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Teilnehmer</span>
              </div>
              <span className="font-medium">
                {tournament.participantCount}/{tournament.maxParticipants}
              </span>
            </div>
            <Progress value={participationProgress} className="h-2" />
          </div>

          {/* Tournament Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTimeUntil(tournament.timeUntilStart)}</span>
            </div>

            {tournament.entryFee && tournament.entryFee > 0 && (
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span>{tournament.entryFee} XP</span>
              </div>
            )}

            {tournament.prizePool && tournament.prizePool > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gaming-primary" />
                <span className="font-medium text-gaming-primary">
                  {tournament.prizePool} XP
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Creator Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>Erstellt von {tournament.creator.username}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {tournament.status === 'active' || tournament.status === 'completed' ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onView?.(tournament.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ansehen
              </Button>
            ) : isParticipating ? (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleLeave}
                disabled={isLoading}
              >
                Verlassen
              </Button>
            ) : tournament.canJoin ? (
              <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Beitreten
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Turnier beitreten</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{tournament.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tournament.gameType.toUpperCase()} • {tournament.format.replace('_', ' ')}
                      </p>
                    </div>

                    {tournament.entryFee && tournament.entryFee > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Teilnahmegebühr:</span>
                          <span className="font-medium">{tournament.entryFee} XP</span>
                        </div>
                      </div>
                    )}

                    {tournament.isPrivate && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Turnier-Passwort</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Passwort eingeben"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowJoinDialog(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleJoin}
                        disabled={isLoading || (tournament.isPrivate && !password)}
                      >
                        {isLoading ? 'Wird beigetreten...' : 'Beitreten'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                {tournament.participantCount >= tournament.maxParticipants
                  ? 'Voll'
                  : 'Nicht verfügbar'
                }
              </Button>
            )}

            <Button variant="ghost" size="sm" asChild>
              <Link href={`/tournaments/${tournament.id}`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}