'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Trophy, Users, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Event {
  id: string
  title: string
  description: string
  type: 'tournament' | 'challenge' | 'special'
  startDate: string
  endDate: string
  participants: number
  maxParticipants: number
  prize: string
  status: 'upcoming' | 'active' | 'ended'
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'GLXY Chess Championship',
    description: 'Wöchentliches Schach-Turnier mit ELO-Wertung',
    type: 'tournament',
    startDate: '2025-09-22T18:00:00Z',
    endDate: '2025-09-22T22:00:00Z',
    participants: 24,
    maxParticipants: 64,
    prize: '1000 GLXY Coins',
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Racing Grand Prix',
    description: 'Drift Racing Liga - Season Finale',
    type: 'tournament',
    startDate: '2025-09-21T20:00:00Z',
    endDate: '2025-09-21T23:00:00Z',
    participants: 45,
    maxParticipants: 32,
    prize: '2500 GLXY Coins',
    status: 'active'
  },
  {
    id: '3',
    title: 'FPS Arena Showdown',
    description: 'Battle Royale Tournament',
    type: 'tournament',
    startDate: '2025-09-23T19:00:00Z',
    endDate: '2025-09-23T21:00:00Z',
    participants: 12,
    maxParticipants: 100,
    prize: '5000 GLXY Coins',
    status: 'upcoming'
  }
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all')

  const filteredEvents = events.filter(event =>
    filter === 'all' || event.status === filter
  )

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500'
      case 'active': return 'bg-green-500 animate-pulse'
      case 'ended': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'tournament': return <Trophy className="h-4 w-4" />
      case 'challenge': return <Zap className="h-4 w-4" />
      case 'special': return <Calendar className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-background to-gaming-dark/50">
      {/* Header */}
      <div className="border-b border-gaming-primary/20 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gaming-primary">Events</h1>
                <p className="text-muted-foreground">
                  Turniere, Challenges und besondere Events
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter */}
        <div className="flex gap-2 mb-8">
          {(['all', 'upcoming', 'active', 'ended'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'Alle' :
               status === 'upcoming' ? 'Bevorstehend' :
               status === 'active' ? 'Aktiv' : 'Beendet'}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border-2 border-gaming-primary/20 hover:border-gaming-primary/60 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(event.type)}
                      <Badge variant="outline" className="capitalize">
                        {event.type === 'tournament' ? 'Turnier' :
                         event.type === 'challenge' ? 'Challenge' : 'Special'}
                      </Badge>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
                  </div>
                  <CardTitle className="text-gaming-primary">{event.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Time & Date */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                      <span>
                        {new Date(event.startDate).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} Uhr
                      </span>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{event.participants}/{event.maxParticipants} Teilnehmer</span>
                    </div>
                    <Badge className="bg-gaming-accent text-white">
                      {event.prize}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {event.status === 'upcoming' && (
                      <Button className="w-full" size="sm">
                        Anmelden
                      </Button>
                    )}
                    {event.status === 'active' && (
                      <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                        Jetzt teilnehmen
                      </Button>
                    )}
                    {event.status === 'ended' && (
                      <Button variant="outline" className="w-full" size="sm">
                        Ergebnisse ansehen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Events gefunden</h3>
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'Aktuell sind keine Events verfügbar.'
                : `Keine ${filter} Events verfügbar.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}