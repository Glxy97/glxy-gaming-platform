// @ts-nocheck
/**
 * GLXY Tournament Mode - Phase 2 Implementation
 * Bracket System, Tournament Lobbies, Prize Distribution, and Spectator Mode
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Users,
  Eye,
  Settings,
  Play,
  Pause,
  SkipForward,
  Clock,
  Star,
  Medal,
  Award,
  Crown,
  Swords,
  Target,
  Tv,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Gift,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// Tournament Types
export type TournamentType = 'solo' | 'duo' | 'squad' | 'custom'
export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
export type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled'
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

// Tournament Configuration
export interface TournamentConfig {
  id: string
  name: string
  description: string
  type: TournamentType
  bracketType: BracketType
  maxParticipants: number
  currentParticipants: number
  entryFee: number
  prizePool: number
  currency: 'credits' | 'premium' | 'real'
  startTime: Date
  endTime?: Date
  registrationDeadline: Date
  rules: TournamentRule[]
  settings: TournamentSettings
  status: TournamentStatus
  createdBy: string
  isPublic: boolean
  isRanked: boolean
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'all'
  region: string
  platform: 'pc' | 'mobile' | 'console' | 'all'
  tags: string[]
  thumbnail?: string
}

export interface TournamentRule {
  id: string
  type: 'weapon' | 'map' | 'mode' | 'time' | 'score' | 'custom'
  name: string
  description: string
  value: any
  isRequired: boolean
}

export interface TournamentSettings {
  matchDuration: number // minutes
  warmupDuration: number // minutes
  breakDuration: number // minutes
  spectatingEnabled: boolean
  commentaryEnabled: boolean
  recordingEnabled: boolean
  autoStart: boolean
  pauseOnDisconnect: boolean
  allowReconnect: boolean
  reconnectTimeLimit: number // seconds
  substitutePlayers: boolean
  banList: string[]
  mapRotation: string[]
  gameMode: string
}

// Tournament Participants
export interface TournamentParticipant {
  id: string
  tournamentId: string
  type: 'player' | 'team'
  name: string
  tag?: string
  avatar?: string
  skillRating: number
  wins: number
  losses: number
  kd: number
  experience: number
  rank: string
  registrationDate: Date
  checkInStatus: 'not_checked' | 'checked' | 'late'
  isReady: boolean
  isConnected: boolean
  score?: number
  placement?: number
  eliminated: boolean
  eliminationTime?: Date
  prize?: TournamentPrize
  notes?: string
  customData?: any
}

export interface TournamentTeam {
  id: string
  tournamentId: string
  name: string
  tag: string
  logo?: string
  captain: string
  members: TournamentParticipant[]
  substitutes: TournamentParticipant[]
  maxMembers: number
  isFull: boolean
  isOpen: boolean
  rating: number
  wins: number
  losses: number
  achievements: string[]
  createdDate: Date
}

// Tournament Brackets
export interface TournamentBracket {
  id: string
  tournamentId: string
  type: BracketType
  rounds: TournamentRound[]
  participants: string[] // participant IDs
  isFinalized: boolean
  generatedDate: Date
}

export interface TournamentRound {
  id: string
  bracketId: string
  roundNumber: number
  name: string
  matches: TournamentMatch[]
  startTime?: Date
  endTime?: Date
  status: 'pending' | 'in_progress' | 'completed'
  bestOf: number // best of X games
}

export interface TournamentMatch {
  id: string
  roundId: string
  matchNumber: number
  participant1: string
  participant2?: string // null for byes
  winner?: string
  loser?: string
  score: {
    participant1: number
    participant2: number
  }
  status: MatchStatus
  startTime?: Date
  endTime?: Date
  duration?: number // seconds
  server?: string
  map?: string
  spectators: string[]
  highlights: MatchHighlight[]
  statistics: MatchStatistics
  notes?: string
}

export interface MatchHighlight {
  id: string
  type: 'kill' | 'win' | 'comeback' | 'clutch' | 'trickshot' | 'multi'
  timestamp: number // seconds into match
  participant: string
  description: string
  clipUrl?: string
  thumbnailUrl?: string
}

export interface MatchStatistics {
  kills: Map<string, number>
  deaths: Map<string, number>
  assists: Map<string, number>
  damage: Map<string, number>
  accuracy: Map<string, number>
  headshots: Map<string, number>
  longestKill: Map<string, number>
  firstBlood: string
  mvps: string[]
}

// Tournament Prizes
export interface TournamentPrize {
  id: string
  position: number
  type: 'currency' | 'item' | 'title' | 'badge' | 'experience' | 'custom'
  name: string
  description: string
  value: number
  currency?: string
  itemId?: string
  icon?: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isGuaranteed: boolean
  chance?: number // 0-100 for random prizes
}

// Tournament History and Statistics
export interface TournamentHistory {
  tournamentId: string
  participantId: string
  placement: number
  score: number
  kills: number
  deaths: number
  kd: number
  survivalTime: number
  damageDealt: number
  prizes: TournamentPrize[]
  earnings: number
  experience: number
  achievements: string[]
  date: Date
  duration: number // minutes
}

export interface TournamentStatistics {
  totalTournaments: number
  wins: number
  top3: number
  top10: number
  totalEarnings: number
  averagePlacement: number
  bestPlacement: number
  totalKills: number
  totalDeaths: number
  averageKD: number
  favoriteMode: TournamentType
  winRate: number
  currentStreak: number
  bestStreak: number
}

// Spectator System
export interface SpectatorSession {
  id: string
  tournamentId: string
  matchId: string
  spectatorId: string
  joinTime: Date
  perspective: 'free' | 'player' | 'overhead' | 'cinematic'
  targetParticipant?: string
  settings: SpectatorSettings
  isActive: boolean
  latency: number
  bandwidthUsage: number
}

export interface SpectatorSettings {
  videoQuality: 'auto' | 'low' | 'medium' | 'high' | 'ultra'
    audioEnabled: boolean
    commentaryEnabled: boolean
    statsEnabled: boolean
    minimapEnabled: boolean
    crosshairEnabled: boolean
    delay: number // seconds
    autoSwitch: boolean
    preferredLanguage: string
}

// Live Streaming Integration
export interface StreamConfig {
  platform: 'twitch' | 'youtube' | 'facebook' | 'trovo' | 'custom'
  streamKey: string
  serverUrl: string
  quality: string
  bitrate: number
  fps: number
  isLive: boolean
  viewerCount: number
  chatEnabled: boolean
  delay: number
}

export class GLXYTournamentMode {
  private tournaments: Map<string, TournamentConfig> = new Map()
  private participants: Map<string, Map<string, TournamentParticipant>> = new Map() // tournamentId -> participantId -> participant
  private teams: Map<string, Map<string, TournamentTeam>> = new Map() // tournamentId -> teamId -> team
  private brackets: Map<string, TournamentBracket> = new Map()
  private matches: Map<string, TournamentMatch> = new Map()
  private spectators: Map<string, SpectatorSession> = new Map()
  private histories: Map<string, TournamentHistory[]> = new Map() // participantId -> history
  private statistics: Map<string, TournamentStatistics> = new Map() // participantId -> statistics

  private activeTournament: string | null = null
  private isSpectating = false
  private spectatorSession: SpectatorSession | null = null

  // Tournament management
  private updateInterval: number = 1000 // 1 second
  private lastUpdate: number = 0

  constructor() {
    this.initializeDefaultTournaments()
    this.startTournamentLoop()
  }

  private initializeDefaultTournaments(): void {
    // Create some default tournament templates
    const defaultTournaments: TournamentConfig[] = [
      {
        id: 'daily_solo',
        name: 'Daily Solo Championship',
        description: 'Compete in daily solo matches for credits and glory',
        type: 'solo',
        bracketType: 'single_elimination',
        maxParticipants: 128,
        currentParticipants: 0,
        entryFee: 100,
        prizePool: 12800,
        currency: 'credits',
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        registrationDeadline: new Date(Date.now() + 3000000), // 50 minutes from now
        rules: this.getDefaultRules('solo'),
        settings: this.getDefaultSettings(),
        status: 'registration',
        createdBy: 'system',
        isPublic: true,
        isRanked: true,
        skillLevel: 'all',
        region: 'global',
        platform: 'all',
        tags: ['daily', 'solo', 'credits']
      },
      {
        id: 'weekly_squad',
        name: 'Weekly Squad Masters',
        description: 'Team up with your squad for weekly tournaments',
        type: 'squad',
        bracketType: 'double_elimination',
        maxParticipants: 64,
        currentParticipants: 0,
        entryFee: 500,
        prizePool: 32000,
        currency: 'credits',
        startTime: new Date(Date.now() + 86400000), // 24 hours from now
        registrationDeadline: new Date(Date.now() + 82800000), // 23 hours from now
        rules: this.getDefaultRules('squad'),
        settings: this.getDefaultSettings(),
        status: 'registration',
        createdBy: 'system',
        isPublic: true,
        isRanked: true,
        skillLevel: 'all',
        region: 'global',
        platform: 'all',
        tags: ['weekly', 'squad', 'team']
      },
      {
        id: 'monthly_pro',
        name: 'Monthly Pro League',
        description: 'High-stakes professional tournament with real prizes',
        type: 'solo',
        bracketType: 'double_elimination',
        maxParticipants: 32,
        currentParticipants: 0,
        entryFee: 1000,
        prizePool: 50000,
        currency: 'premium',
        startTime: new Date(Date.now() + 2592000000), // 30 days from now
        registrationDeadline: new Date(Date.now() + 2505600000), // 29 days from now
        rules: this.getDefaultRules('solo'),
        settings: this.getProSettings(),
        status: 'registration',
        createdBy: 'system',
        isPublic: true,
        isRanked: true,
        skillLevel: 'professional',
        region: 'global',
        platform: 'pc',
        tags: ['monthly', 'pro', 'premium', 'real_money']
      }
    ]

    defaultTournaments.forEach(tournament => {
      this.tournaments.set(tournament.id, tournament)
      this.participants.set(tournament.id, new Map())
      this.teams.set(tournament.id, new Map())
    })
  }

  private getDefaultRules(type: TournamentType): TournamentRule[] {
    const commonRules: TournamentRule[] = [
      {
        id: 'no_cheating',
        type: 'custom',
        name: 'Anti-Cheat',
        description: 'All matches are monitored for cheating',
        value: true,
        isRequired: true
      },
      {
        id: 'sportsmanship',
        type: 'custom',
        name: 'Sportsmanship',
        description: 'Respectful behavior is required',
        value: true,
        isRequired: true
      }
    ]

    switch (type) {
      case 'solo':
        return [
          ...commonRules,
          {
            id: 'max_players',
            type: 'custom',
            name: 'Max Players',
            description: 'Solo matches only',
            value: 1,
            isRequired: true
          }
        ]
      case 'duo':
        return [
          ...commonRules,
          {
            id: 'team_size',
            type: 'custom',
            name: 'Team Size',
            description: 'Teams of 2 players',
            value: 2,
            isRequired: true
          }
        ]
      case 'squad':
        return [
          ...commonRules,
          {
            id: 'team_size',
            type: 'custom',
            name: 'Team Size',
            description: 'Teams of 4 players',
            value: 4,
            isRequired: true
          }
        ]
      default:
        return commonRules
    }
  }

  private getDefaultSettings(): TournamentSettings {
    return {
      matchDuration: 20,
      warmupDuration: 2,
      breakDuration: 5,
      spectatingEnabled: true,
      commentaryEnabled: false,
      recordingEnabled: true,
      autoStart: true,
      pauseOnDisconnect: true,
      allowReconnect: true,
      reconnectTimeLimit: 300,
      substitutePlayers: false,
      banList: [],
      mapRotation: ['erangel', 'miramar', 'sanhok'],
      gameMode: 'battle_royale'
    }
  }

  private getProSettings(): TournamentSettings {
    return {
      ...this.getDefaultSettings(),
      spectatingEnabled: true,
      commentaryEnabled: true,
      recordingEnabled: true,
      autoStart: true,
      pauseOnDisconnect: false,
      allowReconnect: true,
      reconnectTimeLimit: 180,
      substitutePlayers: true,
      banList: ['overpowered_weapon_1', 'unbalanced_item'],
      mapRotation: ['competitive_map_1', 'competitive_map_2'],
      gameMode: 'competitive_battle_royale'
    }
  }

  // Tournament Management
  public createTournament(config: Omit<TournamentConfig, 'id' | 'status' | 'currentParticipants' | 'createdBy'>): string {
    const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const tournament: TournamentConfig = {
      ...config,
      id: tournamentId,
      status: 'registration',
      currentParticipants: 0,
      createdBy: 'user' // Would be actual user ID
    }

    this.tournaments.set(tournamentId, tournament)
    this.participants.set(tournamentId, new Map())
    this.teams.set(tournamentId, new Map())

    return tournamentId
  }

  public getTournament(tournamentId: string): TournamentConfig | null {
    return this.tournaments.get(tournamentId) || null
  }

  public getTournaments(filter?: {
    type?: TournamentType
    status?: TournamentStatus
    skillLevel?: string
    region?: string
    platform?: string
  }): TournamentConfig[] {
    let tournaments = Array.from(this.tournaments.values())

    if (filter) {
      if (filter.type) {
        tournaments = tournaments.filter(t => t.type === filter.type)
      }
      if (filter.status) {
        tournaments = tournaments.filter(t => t.status === filter.status)
      }
      if (filter.skillLevel && filter.skillLevel !== 'all') {
        tournaments = tournaments.filter(t => t.skillLevel === filter.skillLevel)
      }
      if (filter.region && filter.region !== 'global') {
        tournaments = tournaments.filter(t => t.region === filter.region)
      }
      if (filter.platform && filter.platform !== 'all') {
        tournaments = tournaments.filter(t => t.platform === filter.platform)
      }
    }

    return tournaments.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  public registerParticipant(tournamentId: string, participant: Omit<TournamentParticipant, 'id' | 'tournamentId' | 'registrationDate' | 'checkInStatus' | 'isReady' | 'isConnected'>): string {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) throw new Error('Tournament not found')

    if (tournament.status !== 'registration') {
      throw new Error('Registration is not open')
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament is full')
    }

    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const registrationDate = new Date()

    const fullParticipant: TournamentParticipant = {
      ...participant,
      id: participantId,
      tournamentId,
      registrationDate,
      checkInStatus: 'not_checked',
      isReady: false,
      isConnected: false,
      eliminated: false
    }

    this.participants.get(tournamentId)?.set(participantId, fullParticipant)
    tournament.currentParticipants++

    return participantId
  }

  public registerTeam(tournamentId: string, team: Omit<TournamentTeam, 'id' | 'tournamentId' | 'createdDate'>): string {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) throw new Error('Tournament not found')

    if (tournament.type === 'solo') {
      throw new Error('Cannot register team for solo tournament')
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdDate = new Date()

    const fullTeam: TournamentTeam = {
      ...team,
      id: teamId,
      tournamentId,
      createdDate
    }

    this.teams.get(tournamentId)?.set(teamId, fullTeam)

    // Register team members as participants
    for (const member of team.members) {
      this.registerParticipant(tournamentId, {
        ...member,
        type: 'team'
      })
    }

    return teamId
  }

  public generateBracket(tournamentId: string): TournamentBracket {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) throw new Error('Tournament not found')

    if (tournament.status !== 'registration') {
      throw new Error('Cannot generate bracket - registration not complete')
    }

    const participants = Array.from(this.participants.get(tournamentId)?.values() || [])
    if (participants.length < 2) {
      throw new Error('Not enough participants to generate bracket')
    }

    const bracketId = `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generatedDate = new Date()

    const bracket: TournamentBracket = {
      id: bracketId,
      tournamentId,
      type: tournament.bracketType,
      rounds: [],
      participants: participants.map(p => p.id),
      isFinalized: false,
      generatedDate
    }

    // Generate rounds and matches based on bracket type
    this.generateBracketRounds(bracket, participants)

    this.brackets.set(bracketId, bracket)
    tournament.status = 'in_progress'

    return bracket
  }

  private generateBracketRounds(bracket: TournamentBracket, participants: TournamentParticipant[]): void {
    switch (bracket.type) {
      case 'single_elimination':
        this.generateSingleEliminationBracket(bracket, participants)
        break
      case 'double_elimination':
        this.generateDoubleEliminationBracket(bracket, participants)
        break
      case 'round_robin':
        this.generateRoundRobinBracket(bracket, participants)
        break
      case 'swiss':
        this.generateSwissBracket(bracket, participants)
        break
    }
  }

  private generateSingleEliminationBracket(bracket: TournamentBracket, participants: TournamentParticipant[]): void {
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)
    const roundCount = Math.ceil(Math.log2(shuffledParticipants.length))

    for (let roundNum = 0; roundNum < roundCount; roundNum++) {
      const roundId = `round_${bracket.id}_${roundNum}`
      const round: TournamentRound = {
        id: roundId,
        bracketId: bracket.id,
        roundNumber: roundNum,
        name: roundNum === 0 ? 'Round 1' : roundNum === roundCount - 1 ? 'Finals' : `Round ${roundNum + 1}`,
        matches: [],
        status: 'pending',
        bestOf: roundNum === roundCount - 1 ? 5 : 3 // Finals are best of 5, others are best of 3
      }

      const matchCount = Math.ceil(shuffledParticipants.length / Math.pow(2, roundNum + 1))

      for (let matchNum = 0; matchNum < matchCount; matchNum++) {
        const matchId = `match_${roundId}_${matchNum}`

        const participant1Index = matchNum * 2
        const participant2Index = matchNum * 2 + 1

        const match: TournamentMatch = {
          id: matchId,
          roundId,
          matchNumber: matchNum,
          participant1: shuffledParticipants[participant1Index]?.id || '',
          participant2: shuffledParticipants[participant2Index]?.id,
          score: { participant1: 0, participant2: 0 },
          status: 'scheduled',
          spectators: [],
          highlights: [],
          statistics: {
            kills: new Map(),
            deaths: new Map(),
            assists: new Map(),
            damage: new Map(),
            accuracy: new Map(),
            headshots: new Map(),
            longestKill: new Map(),
            firstBlood: '',
            mvps: []
          }
        }

        round.matches.push(match)
        this.matches.set(matchId, match)
      }

      bracket.rounds.push(round)
    }

    bracket.isFinalized = true
  }

  private generateDoubleEliminationBracket(bracket: TournamentBracket, participants: TournamentParticipant[]): void {
    // Similar to single elimination but with losers bracket
    // Implementation would be more complex
    this.generateSingleEliminationBracket(bracket, participants) // Simplified for now
  }

  private generateRoundRobinBracket(bracket: TournamentBracket, participants: TournamentParticipant[]): void {
    // Round robin where everyone plays everyone
    const roundCount = participants.length - 1

    for (let roundNum = 0; roundNum < roundCount; roundNum++) {
      const roundId = `round_${bracket.id}_${roundNum}`
      const round: TournamentRound = {
        id: roundId,
        bracketId: bracket.id,
        roundNumber: roundNum,
        name: `Round ${roundNum + 1}`,
        matches: [],
        status: 'pending',
        bestOf: 1
      }

      // Generate matches for this round
      for (let i = 0; i < participants.length / 2; i++) {
        const matchId = `match_${roundId}_${i}`

        const participant1Index = (roundNum + i) % participants.length
        const participant2Index = (roundNum + participants.length - 1 - i) % participants.length

        if (participant1Index !== participant2Index) {
          const match: TournamentMatch = {
            id: matchId,
            roundId,
            matchNumber: i,
            participant1: participants[participant1Index].id,
            participant2: participants[participant2Index].id,
            score: { participant1: 0, participant2: 0 },
            status: 'scheduled',
            spectators: [],
            highlights: [],
            statistics: {
              kills: new Map(),
              deaths: new Map(),
              assists: new Map(),
              damage: new Map(),
              accuracy: new Map(),
              headshots: new Map(),
              longestKill: new Map(),
              firstBlood: '',
              mvps: []
            }
          }

          round.matches.push(match)
          this.matches.set(matchId, match)
        }
      }

      bracket.rounds.push(round)
    }

    bracket.isFinalized = true
  }

  private generateSwissBracket(bracket: TournamentBracket, participants: TournamentParticipant[]): void {
    // Swiss system where players with similar scores play each other
    // Implementation would be complex with score tracking and pairing
    this.generateRoundRobinBracket(bracket, participants) // Simplified for now
  }

  // Match Management
  public startMatch(matchId: string): boolean {
    const match = this.matches.get(matchId)
    if (!match) return false

    if (match.status !== 'scheduled') return false

    match.status = 'in_progress'
    match.startTime = new Date()

    // Create game server for match
    // This would integrate with your game server system
    match.server = `server_${matchId}`

    return true
  }

  public endMatch(matchId: string, winner: string, finalScore: { participant1: number; participant2: number }): boolean {
    const match = this.matches.get(matchId)
    if (!match) return false

    if (match.status !== 'in_progress') return false

    match.winner = winner
    match.loser = winner === match.participant1 ? match.participant2 : match.participant1
    match.score = finalScore
    match.status = 'completed'
    match.endTime = new Date()

    if (match.startTime) {
      match.duration = Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000)
    }

    // Update bracket progression
    this.updateBracketProgression(match)

    // Generate prizes for winner
    this.distributePrizes(match)

    return true
  }

  private updateBracketProgression(match: TournamentMatch): void {
    const bracket = this.brackets.get(match.roundId)
    if (!bracket) return

    const round = bracket.rounds.find(r => r.id === match.roundId)
    if (!round) return

    // Mark round as completed if all matches are done
    const allMatchesCompleted = round.matches.every(m => m.status === 'completed')
    if (allMatchesCompleted) {
      round.status = 'completed'
      round.endTime = new Date()

      // Start next round if available
      const nextRound = bracket.rounds.find(r => r.roundNumber === round.roundNumber + 1)
      if (nextRound && nextRound.status === 'pending') {
        nextRound.status = 'in_progress'
        this.scheduleNextRoundMatches(nextRound, match)
      }
    }
  }

  private scheduleNextRoundMatches(nextRound: TournamentRound, previousMatch: TournamentMatch): void {
    // Schedule matches for next round based on winners
    nextRound.matches.forEach(match => {
      if (match.status === 'scheduled') {
        // Set start time based on previous match completion
        match.startTime = new Date(Date.now() + 600000) // 10 minutes from now
      }
    })
  }

  private distributePrizes(match: TournamentMatch): void {
    // Calculate and distribute prizes for match winners
    // This would integrate with your prize system
  }

  // Spectator System
  public joinSpectatorMode(tournamentId: string, matchId: string, spectatorId: string): SpectatorSession {
    const session: SpectatorSession = {
      id: `spectator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tournamentId,
      matchId,
      spectatorId,
      joinTime: new Date(),
      perspective: 'free',
      settings: {
        videoQuality: 'auto',
        audioEnabled: true,
        commentaryEnabled: true,
        statsEnabled: true,
        minimapEnabled: true,
        crosshairEnabled: false,
        delay: 15, // 15 second delay for competitive integrity
        autoSwitch: false,
        preferredLanguage: 'english'
      },
      isActive: true,
      latency: 0,
      bandwidthUsage: 0
    }

    this.spectators.set(session.id, session)

    // Add spectator to match
    const match = this.matches.get(matchId)
    if (match) {
      match.spectators.push(spectatorId)
    }

    return session
  }

  public leaveSpectatorMode(sessionId: string): boolean {
    const session = this.spectators.get(sessionId)
    if (!session) return false

    session.isActive = false

    // Remove spectator from match
    const match = this.matches.get(session.matchId)
    if (match) {
      match.spectators = match.spectators.filter(id => id !== session.spectatorId)
    }

    this.spectators.delete(sessionId)
    return true
  }

  public updateSpectatorSettings(sessionId: string, settings: Partial<SpectatorSettings>): boolean {
    const session = this.spectators.get(sessionId)
    if (!session) return false

    session.settings = { ...session.settings, ...settings }
    return true
  }

  // Tournament History and Statistics
  public getParticipantHistory(participantId: string): TournamentHistory[] {
    return this.histories.get(participantId) || []
  }

  public getParticipantStatistics(participantId: string): TournamentStatistics | null {
    return this.statistics.get(participantId) || null
  }

  public updateParticipantStatistics(participantId: string, tournamentResult: TournamentHistory): void {
    let stats = this.statistics.get(participantId)

    if (!stats) {
      stats = {
        totalTournaments: 0,
        wins: 0,
        top3: 0,
        top10: 0,
        totalEarnings: 0,
        averagePlacement: 0,
        bestPlacement: 999,
        totalKills: 0,
        totalDeaths: 0,
        averageKD: 0,
        favoriteMode: 'solo',
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0
      }
      this.statistics.set(participantId, stats)
    }

    // Update statistics
    stats.totalTournaments++
    stats.totalKills += tournamentResult.kills
    stats.totalDeaths += tournamentResult.deaths
    stats.totalEarnings += tournamentResult.earnings
    stats.bestPlacement = Math.min(stats.bestPlacement, tournamentResult.placement)
    stats.averageKD = stats.totalKills / Math.max(stats.totalDeaths, 1)

    if (tournamentResult.placement === 1) {
      stats.wins++
      stats.currentStreak++
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
    } else {
      stats.currentStreak = 0
    }

    if (tournamentResult.placement <= 3) stats.top3++
    if (tournamentResult.placement <= 10) stats.top10++

    stats.winRate = (stats.wins / stats.totalTournaments) * 100

    // Update history
    const history = this.histories.get(participantId) || []
    history.push(tournamentResult)
    this.histories.set(participantId, history)
  }

  // Tournament Loop
  private startTournamentLoop(): void {
    setInterval(() => {
      this.updateTournaments()
    }, this.updateInterval)
  }

  private updateTournaments(): void {
    const currentTime = Date.now()

    // Check tournament start times
    for (const tournament of this.tournaments.values()) {
      if (tournament.status === 'registration' && currentTime >= tournament.startTime.getTime()) {
        this.startTournament(tournament.id)
      }

      if (tournament.status === 'in_progress') {
        this.updateTournamentProgress(tournament.id)
      }
    }

    // Update spectator sessions
    for (const session of this.spectators.values()) {
      if (session.isActive) {
        this.updateSpectatorSession(session)
      }
    }
  }

  private startTournament(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) return

    // Check in participants
    this.checkInParticipants(tournamentId)

    // Generate bracket if not already done
    if (!this.brackets.has(tournamentId)) {
      this.generateBracket(tournamentId)
    }

    tournament.status = 'in_progress'
    this.activeTournament = tournamentId
  }

  private checkInParticipants(tournamentId: string): void {
    const participants = this.participants.get(tournamentId)
    if (!participants) return

    const checkInDeadline = this.tournaments.get(tournamentId)?.registrationDeadline
    if (!checkInDeadline) return

    for (const participant of participants.values()) {
      if (participant.checkInStatus === 'not_checked') {
        // Mark as late if past deadline
        if (Date.now() > checkInDeadline.getTime()) {
          participant.checkInStatus = 'late'
        }
      }
    }
  }

  private updateTournamentProgress(tournamentId: string): void {
    const bracket = this.brackets.get(tournamentId)
    if (!bracket) return

    // Check if tournament is complete
    const finalRound = bracket.rounds[bracket.rounds.length - 1]
    if (finalRound && finalRound.status === 'completed') {
      const tournament = this.tournaments.get(tournamentId)
      if (tournament) {
        tournament.status = 'completed'
        tournament.endTime = new Date()
      }
    }
  }

  private updateSpectatorSession(session: SpectatorSession): void {
    // Update spectator latency and bandwidth
    // This would integrate with your networking system
    session.latency = Math.random() * 50 + 10 // 10-60ms
    session.bandwidthUsage = Math.random() * 2000 + 1000 // 1-3 Mbps
  }

  // Public Getters
  public getActiveTournament(): TournamentConfig | null {
    return this.activeTournament ? this.tournaments.get(this.activeTournament) || null : null
  }

  public getMatch(matchId: string): TournamentMatch | null {
    return this.matches.get(matchId) || null
  }

  public getBracket(tournamentId: string): TournamentBracket | null {
    return this.brackets.get(tournamentId) || null
  }

  public getSpectators(tournamentId: string): SpectatorSession[] {
    return Array.from(this.spectators.values()).filter(s => s.tournamentId === tournamentId && s.isActive)
  }

  public isSpectatorActive(): boolean {
    return this.isSpectating && this.spectatorSession !== null
  }

  public setTournamentMode(enabled: boolean): void {
    this.isSpectating = enabled
    if (!enabled && this.spectatorSession) {
      this.leaveSpectatorMode(this.spectatorSession.id)
      this.spectatorSession = null
    }
  }

  // Cleanup
  public destroy(): void {
    this.tournaments.clear()
    this.participants.clear()
    this.teams.clear()
    this.brackets.clear()
    this.matches.clear()
    this.spectators.clear()
    this.histories.clear()
    this.statistics.clear()
    this.activeTournament = null
    this.isSpectating = false
    this.spectatorSession = null
  }
}

// React Component for Tournament Mode UI
export function GLXYTournamentModeUI() {
  const [tournamentMode, setTournamentMode] = useState(() => new GLXYTournamentMode())
  const [activeTab, setActiveTab] = useState('browse')
  const [selectedTournament, setSelectedTournament] = useState<TournamentConfig | null>(null)
  const [tournaments, setTournaments] = useState<TournamentConfig[]>([])
  const [spectatorCount, setSpectatorCount] = useState(0)

  useEffect(() => {
    // Update tournaments list periodically
    const interval = setInterval(() => {
      setTournaments(tournamentMode.getTournaments())
      const activeTournament = tournamentMode.getActiveTournament()
      if (activeTournament) {
        setSpectatorCount(tournamentMode.getSpectators(activeTournament.id).length)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [tournamentMode])

  const registerForTournament = (tournamentId: string) => {
    // This would get current user data
    const participant = {
      type: 'player' as const,
      name: 'Player One',
      skillRating: 1500,
      wins: 10,
      losses: 5,
      kd: 1.2,
      experience: 5000,
      rank: 'Gold'
    }

    try {
      const participantId = tournamentMode.registerParticipant(tournamentId, participant as Omit<TournamentParticipant, 'id' | 'tournamentId' | 'registrationDate' | 'checkInStatus' | 'isReady' | 'isConnected'>)
      toast.success('Successfully registered for tournament!')
      setTournaments(tournamentMode.getTournaments())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  const joinSpectatorMode = (tournamentId: string) => {
    const activeTournament = tournamentMode.getActiveTournament()
    if (!activeTournament || activeTournament.id !== tournamentId) {
      tournamentMode.setTournamentMode(false)
      // Switch to active tournament or show message
      return
    }

    // Find an active match to spectate
    const bracket = tournamentMode.getBracket(tournamentId)
    if (bracket) {
      const activeRound = bracket.rounds.find(r => r.status === 'in_progress')
      if (activeRound && activeRound.matches.length > 0) {
        const activeMatch = activeRound.matches.find(m => m.status === 'in_progress') || activeRound.matches[0]

        const session = tournamentMode.joinSpectatorMode(tournamentId, activeMatch.id, 'spectator_user')
        tournamentMode.setTournamentMode(true)
        toast.success('Joined spectator mode!')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'bg-blue-500'
      case 'in_progress': return 'bg-green-500'
      case 'completed': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo': return '👤'
      case 'duo': return '👥'
      case 'squad': return '👨‍👩‍👧‍👦'
      case 'custom': return '⚙️'
      default: return '🎮'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">GLXY Tournament Mode</h1>
        <p className="text-gray-300">Compete in tournaments, spectate matches, and win prizes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-tournaments">My Tournaments</TabsTrigger>
          <TabsTrigger value="brackets">Brackets</TabsTrigger>
          <TabsTrigger value="spectate">Spectate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Available Tournaments</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="duo">Duo</SelectItem>
                  <SelectItem value="squad">Squad</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map(tournament => (
              <motion.div
                key={tournament.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(tournament.type)}</span>
                        <h3 className="font-semibold text-white">{tournament.name}</h3>
                      </div>
                      <Badge className={`${getStatusColor(tournament.status)} text-white text-xs`}>
                        {tournament.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">{tournament.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{tournament.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bracket:</span>
                        <span className="text-white capitalize">{tournament.bracketType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry:</span>
                        <span className="text-yellow-400">{tournament.entryFee} {tournament.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prize Pool:</span>
                        <span className="text-green-400">{tournament.prizePool} {tournament.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-white">{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Starts in:</span>
                        <span className="text-white">
                          {Math.max(0, Math.floor((tournament.startTime.getTime() - Date.now()) / (1000 * 60 * 60)))}h
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={tournament.status !== 'registration' || tournament.currentParticipants >= tournament.maxParticipants}
                        onClick={() => registerForTournament(tournament.id)}
                      >
                        {tournament.status === 'registration' ? 'Register' : 'Closed'}
                      </Button>
                      {tournament.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinSpectatorMode(tournament.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {tournament.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-tournaments" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white mb-2">My Tournaments</h3>
              <p className="text-gray-400 mb-4">View your registered tournaments and upcoming matches</p>
              <Button onClick={() => setActiveTab('browse')}>
                Browse Tournaments
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brackets" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Tournament Brackets</h3>
              <p className="text-gray-400 mb-4">View tournament brackets and match results</p>
              <Button onClick={() => setActiveTab('browse')}>
                Select Tournament
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spectate" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Spectator Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tournamentMode.isSpectatorActive() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Currently Spectating</h3>
                    <Button
                      variant="destructive"
                      onClick={() => tournamentMode.setTournamentMode(false)}
                    >
                      Exit Spectator Mode
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-700/50">
                      <CardContent className="p-3 text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-2xl font-bold text-white">{spectatorCount}</div>
                        <div className="text-xs text-gray-400">Spectators</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700/50">
                      <CardContent className="p-3 text-center">
                        <Tv className="h-6 w-6 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold text-white">HD</div>
                        <div className="text-xs text-gray-400">Quality</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700/50">
                      <CardContent className="p-3 text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                        <div className="text-2xl font-bold text-white">15s</div>
                        <div className="text-xs text-gray-400">Delay</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700/50">
                      <CardContent className="p-3 text-center">
                        <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                        <div className="text-2xl font-bold text-white">On</div>
                        <div className="text-xs text-gray-400">Chat</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label>Spectator Settings</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Change View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mic className="h-4 w-4 mr-2" />
                        Toggle Audio
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Not Spectating</h3>
                  <p className="text-gray-400 mb-4">Join a tournament to start spectating matches</p>
                  <Button onClick={() => setActiveTab('browse')}>
                    Browse Tournaments
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Tournament History</h3>
              <p className="text-gray-400 mb-4">View your past tournament results and statistics</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">0</div>
                  <div className="text-xs text-gray-400">Tournaments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">0</div>
                  <div className="text-xs text-gray-400">Top 3</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-xs text-gray-400">Earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GLXYTournamentModeUI