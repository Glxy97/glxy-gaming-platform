/**
 * GLXY Ultimate FPS - Matchmaking System
 *
 * Skill-based matchmaking with:
 * - ELO/MMR-based matching
 * - Queue management
 * - Party system integration
 * - Rank-based matching
 * - Region preference
 * - Match balancing
 *
 * @module Matchmaking
 * @version 1.10.0-alpha
 */

import { NetworkManager } from './NetworkManager'
import {
  MatchmakingConfig,
  MatchmakingTicket,
  MatchmakingMode,
  ServerRegion,
  MatchFoundData,
  PartyInfo
} from './data/NetworkData'

/**
 * Matchmaking event types
 */
export enum MatchmakingEventType {
  QUEUE_JOINED = 'queue_joined',
  QUEUE_LEFT = 'queue_left',
  MATCH_FOUND = 'match_found',
  MATCH_ACCEPTED = 'match_accepted',
  MATCH_DECLINED = 'match_declined',
  MATCH_CANCELLED = 'match_cancelled',
  MATCH_READY = 'match_ready',
  QUEUE_TIME_UPDATE = 'queue_time_update',
  QUEUE_POSITION_UPDATE = 'queue_position_update',
  PLAYER_RATING_UPDATED = 'player_rating_updated'
}

/**
 * Matchmaking event
 */
export interface MatchmakingEvent {
  type: MatchmakingEventType
  timestamp: number
  data?: any
}

/**
 * Player rating/skill level
 */
export interface PlayerRating {
  playerId: string
  mmr: number // Matchmaking Rating (ELO-style)
  rank: string // Bronze, Silver, Gold, etc.
  division: number // 1-5 within rank
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  streak: number // Current win/loss streak
  peakMmr: number
  seasonMmr: number
  lastUpdate: number
}

/**
 * Match configuration
 */
export interface MatchConfig {
  matchId: string
  serverId: string
  roomId: string
  gameMode: string
  mapName: string
  maxPlayers: number
  teamSize: number

  // Player allocation
  teamA: string[] // Player IDs
  teamB: string[]

  // Skill balance
  avgMmrTeamA: number
  avgMmrTeamB: number
  skillBalance: number // 0-1, closer to 1 is more balanced

  // Match quality
  matchQuality: number // 0-1
  estimatedDuration: number // seconds

  createdAt: number
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  mode: MatchmakingMode
  playersInQueue: number
  averageWaitTime: number // seconds
  medianWaitTime: number
  maxWaitTime: number
  matchesCreated: number
  matchesCompleted: number
  averageMatchQuality: number
  peakPlayers: number
  lastUpdate: number
}

/**
 * Matchmaking System - Skill-based match finding
 */
export class Matchmaking {
  private networkManager: NetworkManager
  private currentTicket: MatchmakingTicket | null = null
  private playerRating: PlayerRating | null = null
  private party: PartyInfo | null = null

  // Queue Management
  private queueStartTime: number = 0
  private queuePosition: number = 0
  private estimatedWaitTime: number = 0

  // Match Found
  private pendingMatch: MatchFoundData | null = null
  private acceptDeadline: number = 0

  // Statistics
  private queueStats: Map<MatchmakingMode, QueueStatistics> = new Map()

  // Events
  private eventCallbacks: Map<MatchmakingEventType, Array<(event: MatchmakingEvent) => void>> = new Map()

  // Timers
  private queueTimer: any = null
  private acceptTimer: any = null

  /**
   * Constructor
   */
  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager
    this.loadPlayerRating()
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Join matchmaking queue
   */
  public async joinQueue(config: Partial<MatchmakingConfig>): Promise<MatchmakingTicket> {
    if (this.currentTicket) {
      throw new Error('Already in matchmaking queue')
    }

    if (!this.playerRating) {
      await this.loadPlayerRating()
    }

    // Create default config
    const fullConfig: MatchmakingConfig = {
      mode: config.mode || MatchmakingMode.CASUAL,
      gameMode: config.gameMode || 'Team Deathmatch',
      region: config.region || ServerRegion.EUROPE,
      skillBased: config.skillBased !== undefined ? config.skillBased : true,
      skillRange: config.skillRange || 200, // MMR range
      partyId: config.partyId,
      partySize: config.partySize || 1,
      maxPartySize: config.maxPartySize || 5,
      preferredRegions: config.preferredRegions || [config.region || ServerRegion.EUROPE],
      acceptedGameModes: config.acceptedGameModes || [config.gameMode || 'Team Deathmatch'],
      acceptedMaps: config.acceptedMaps || [],
      searchTimeout: config.searchTimeout || 300000, // 5 minutes
      acceptTimeout: config.acceptTimeout || 30000, // 30 seconds
      prioritizeSpeed: config.prioritizeSpeed || false,
      allowBots: config.allowBots || false,
      minPlayerLevel: config.minPlayerLevel,
      maxPlayerLevel: config.maxPlayerLevel,
      requireRank: config.requireRank || false
    }

    // Create ticket
    const ticket: MatchmakingTicket = {
      ticketId: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: this.networkManager.getClientId(),
      partyId: fullConfig.partyId,
      config: fullConfig,
      status: 'searching',
      createdAt: Date.now(),
      expiresAt: Date.now() + fullConfig.searchTimeout
    }

    this.currentTicket = ticket
    this.queueStartTime = Date.now()

    // Start queue timer
    this.startQueueTimer()

    // Send matchmaking request
    // In production, send packet through NetworkManager
    await this.simulateMatchmakingSearch(ticket)

    this.dispatchEvent({
      type: MatchmakingEventType.QUEUE_JOINED,
      timestamp: Date.now(),
      data: { ticket }
    })

    return ticket
  }

  /**
   * Leave matchmaking queue
   */
  public async leaveQueue(): Promise<void> {
    if (!this.currentTicket) {
      throw new Error('Not in matchmaking queue')
    }

    const ticket = this.currentTicket

    // Update ticket status
    ticket.status = 'cancelled'

    // Send cancel request
    // In production, send packet through NetworkManager

    this.cleanup()

    this.dispatchEvent({
      type: MatchmakingEventType.QUEUE_LEFT,
      timestamp: Date.now(),
      data: { ticketId: ticket.ticketId }
    })
  }

  /**
   * Simulate matchmaking search (for development)
   */
  private async simulateMatchmakingSearch(ticket: MatchmakingTicket): Promise<void> {
    // Simulate finding a match after random delay
    const matchDelay = ticket.config.prioritizeSpeed
      ? Math.random() * 10000 + 5000 // 5-15 seconds for fast queue
      : Math.random() * 30000 + 15000 // 15-45 seconds for quality queue

    setTimeout(() => {
      if (this.currentTicket?.ticketId === ticket.ticketId) {
        this.simulateMatchFound(ticket)
      }
    }, matchDelay)
  }

  /**
   * Simulate match found (for development)
   */
  private simulateMatchFound(ticket: MatchmakingTicket): void {
    const matchFound: MatchFoundData = {
      ticketId: ticket.ticketId,
      matchId: `match-${Date.now()}`,
      serverId: `server-${ticket.config.region}-1`,
      roomId: `room-${Date.now()}`,
      players: [
        ticket.playerId,
        `player-${Math.random().toString(36).substr(2, 9)}`,
        `player-${Math.random().toString(36).substr(2, 9)}`,
        `player-${Math.random().toString(36).substr(2, 9)}`
      ],
      estimatedPing: ticket.config.region === ServerRegion.EUROPE ? 25 : 95,
      acceptDeadline: Date.now() + ticket.config.acceptTimeout
    }

    this.pendingMatch = matchFound
    this.acceptDeadline = matchFound.acceptDeadline

    // Update ticket
    ticket.status = 'found'
    ticket.matchId = matchFound.matchId
    ticket.serverId = matchFound.serverId
    ticket.roomId = matchFound.roomId
    ticket.estimatedPing = matchFound.estimatedPing
    ticket.foundAt = Date.now()
    ticket.searchTime = Date.now() - ticket.createdAt

    // Start accept timer
    this.startAcceptTimer()

    this.dispatchEvent({
      type: MatchmakingEventType.MATCH_FOUND,
      timestamp: Date.now(),
      data: matchFound
    })
  }

  /**
   * Accept match
   */
  public async acceptMatch(): Promise<void> {
    if (!this.pendingMatch) {
      throw new Error('No pending match to accept')
    }

    if (Date.now() > this.acceptDeadline) {
      throw new Error('Match accept deadline passed')
    }

    // Update ticket status
    if (this.currentTicket) {
      this.currentTicket.status = 'accepted'
    }

    // Send accept packet
    // In production, send packet through NetworkManager

    this.stopAcceptTimer()

    this.dispatchEvent({
      type: MatchmakingEventType.MATCH_ACCEPTED,
      timestamp: Date.now(),
      data: { matchId: this.pendingMatch.matchId }
    })

    // Wait for match to be ready
    // In production, wait for server confirmation
    setTimeout(() => {
      this.dispatchEvent({
        type: MatchmakingEventType.MATCH_READY,
        timestamp: Date.now(),
        data: this.pendingMatch
      })
    }, 2000)
  }

  /**
   * Decline match
   */
  public async declineMatch(): Promise<void> {
    if (!this.pendingMatch) {
      throw new Error('No pending match to decline')
    }

    const matchId = this.pendingMatch.matchId

    // Update ticket status
    if (this.currentTicket) {
      this.currentTicket.status = 'declined'
    }

    // Send decline packet
    // In production, send packet through NetworkManager

    this.cleanup()

    this.dispatchEvent({
      type: MatchmakingEventType.MATCH_DECLINED,
      timestamp: Date.now(),
      data: { matchId }
    })
  }

  /**
   * Start queue timer
   */
  private startQueueTimer(): void {
    this.queueTimer = setInterval(() => {
      const elapsed = Date.now() - this.queueStartTime

      // Update estimated wait time (would come from server in production)
      this.estimatedWaitTime = 30 // seconds

      this.dispatchEvent({
        type: MatchmakingEventType.QUEUE_TIME_UPDATE,
        timestamp: Date.now(),
        data: {
          queueTime: elapsed,
          estimatedWaitTime: this.estimatedWaitTime * 1000
        }
      })

      // Check timeout
      if (this.currentTicket && Date.now() > this.currentTicket.expiresAt) {
        this.currentTicket.status = 'timeout'
        this.cleanup()

        this.dispatchEvent({
          type: MatchmakingEventType.MATCH_CANCELLED,
          timestamp: Date.now(),
          data: { reason: 'timeout' }
        })
      }
    }, 1000)
  }

  /**
   * Stop queue timer
   */
  private stopQueueTimer(): void {
    if (this.queueTimer) {
      clearInterval(this.queueTimer)
      this.queueTimer = null
    }
  }

  /**
   * Start accept timer
   */
  private startAcceptTimer(): void {
    this.acceptTimer = setInterval(() => {
      const remaining = this.acceptDeadline - Date.now()

      if (remaining <= 0) {
        // Auto-decline if not accepted in time
        this.declineMatch().catch(console.error)
      }
    }, 100)
  }

  /**
   * Stop accept timer
   */
  private stopAcceptTimer(): void {
    if (this.acceptTimer) {
      clearInterval(this.acceptTimer)
      this.acceptTimer = null
    }
  }

  // ============================================================================
  // PLAYER RATING
  // ============================================================================

  /**
   * Load player rating
   */
  private async loadPlayerRating(): Promise<void> {
    // In production, fetch from server
    // For now, load from local storage or create default

    try {
      const stored = localStorage.getItem('glxy_fps_player_rating')
      if (stored) {
        this.playerRating = JSON.parse(stored)
      } else {
        this.playerRating = this.createDefaultRating()
        this.savePlayerRating()
      }
    } catch (error) {
      console.error('Failed to load player rating:', error)
      this.playerRating = this.createDefaultRating()
    }
  }

  /**
   * Save player rating
   */
  private savePlayerRating(): void {
    if (!this.playerRating) return

    try {
      localStorage.setItem('glxy_fps_player_rating', JSON.stringify(this.playerRating))
    } catch (error) {
      console.error('Failed to save player rating:', error)
    }
  }

  /**
   * Create default player rating
   */
  private createDefaultRating(): PlayerRating {
    return {
      playerId: this.networkManager.getClientId(),
      mmr: 1000, // Starting MMR
      rank: 'Bronze',
      division: 1,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      streak: 0,
      peakMmr: 1000,
      seasonMmr: 1000,
      lastUpdate: Date.now()
    }
  }

  /**
   * Update player rating after match
   */
  public updateRating(won: boolean, opponentMmr: number): void {
    if (!this.playerRating) {
      this.playerRating = this.createDefaultRating()
    }

    const oldMmr = this.playerRating.mmr

    // Calculate MMR change using ELO formula
    const kFactor = this.calculateKFactor()
    const expectedScore = this.calculateExpectedScore(this.playerRating.mmr, opponentMmr)
    const actualScore = won ? 1 : 0
    const mmrChange = Math.round(kFactor * (actualScore - expectedScore))

    // Update MMR
    this.playerRating.mmr = Math.max(0, this.playerRating.mmr + mmrChange)

    // Update stats
    this.playerRating.gamesPlayed++
    if (won) {
      this.playerRating.wins++
      this.playerRating.streak = Math.max(0, this.playerRating.streak) + 1
    } else {
      this.playerRating.losses++
      this.playerRating.streak = Math.min(0, this.playerRating.streak) - 1
    }

    this.playerRating.winRate = this.playerRating.wins / this.playerRating.gamesPlayed

    // Update peak MMR
    if (this.playerRating.mmr > this.playerRating.peakMmr) {
      this.playerRating.peakMmr = this.playerRating.mmr
    }

    // Update rank
    this.updateRank()

    this.playerRating.lastUpdate = Date.now()

    this.savePlayerRating()

    this.dispatchEvent({
      type: MatchmakingEventType.PLAYER_RATING_UPDATED,
      timestamp: Date.now(),
      data: {
        oldMmr,
        newMmr: this.playerRating.mmr,
        change: mmrChange,
        won
      }
    })
  }

  /**
   * Calculate K-factor for ELO calculation
   */
  private calculateKFactor(): number {
    if (!this.playerRating) return 32

    // Higher K-factor for new players
    if (this.playerRating.gamesPlayed < 30) {
      return 40
    } else if (this.playerRating.gamesPlayed < 100) {
      return 32
    } else {
      return 24
    }
  }

  /**
   * Calculate expected score using ELO formula
   */
  private calculateExpectedScore(playerMmr: number, opponentMmr: number): number {
    return 1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 400))
  }

  /**
   * Update player rank based on MMR
   */
  private updateRank(): void {
    if (!this.playerRating) return

    const mmr = this.playerRating.mmr

    // Rank thresholds
    const ranks = [
      { name: 'Bronze', mmr: 0 },
      { name: 'Silver', mmr: 1200 },
      { name: 'Gold', mmr: 1500 },
      { name: 'Platinum', mmr: 1800 },
      { name: 'Diamond', mmr: 2100 },
      { name: 'Master', mmr: 2400 },
      { name: 'Grandmaster', mmr: 2700 },
      { name: 'Legend', mmr: 3000 }
    ]

    // Find appropriate rank
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (mmr >= ranks[i].mmr) {
        this.playerRating.rank = ranks[i].name

        // Calculate division within rank (1-5)
        if (i < ranks.length - 1) {
          const rankRange = ranks[i + 1].mmr - ranks[i].mmr
          const mmrInRank = mmr - ranks[i].mmr
          this.playerRating.division = Math.min(5, Math.floor((mmrInRank / rankRange) * 5) + 1)
        } else {
          this.playerRating.division = 1
        }

        break
      }
    }
  }

  // ============================================================================
  // QUEUE STATISTICS
  // ============================================================================

  /**
   * Get queue statistics
   */
  public async getQueueStats(mode: MatchmakingMode): Promise<QueueStatistics> {
    // In production, fetch from server
    // For now, return mock data

    let stats = this.queueStats.get(mode)

    if (!stats) {
      stats = {
        mode: mode,
        playersInQueue: Math.floor(Math.random() * 1000) + 100,
        averageWaitTime: Math.random() * 60 + 30,
        medianWaitTime: Math.random() * 45 + 25,
        maxWaitTime: Math.random() * 120 + 60,
        matchesCreated: Math.floor(Math.random() * 10000) + 1000,
        matchesCompleted: Math.floor(Math.random() * 9000) + 900,
        averageMatchQuality: Math.random() * 0.3 + 0.7,
        peakPlayers: Math.floor(Math.random() * 2000) + 500,
        lastUpdate: Date.now()
      }

      this.queueStats.set(mode, stats)
    }

    return stats
  }

  // ============================================================================
  // PARTY SYSTEM INTEGRATION
  // ============================================================================

  /**
   * Join queue with party
   */
  public async joinQueueWithParty(party: PartyInfo, config: Partial<MatchmakingConfig>): Promise<MatchmakingTicket> {
    this.party = party

    // Update config with party info
    const partyConfig: Partial<MatchmakingConfig> = {
      ...config,
      partyId: party.partyId,
      partySize: party.members.size,
      maxPartySize: party.maxMembers
    }

    return await this.joinQueue(partyConfig)
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to event
   */
  public on(eventType: MatchmakingEventType, callback: (event: MatchmakingEvent) => void): void {
    let callbacks = this.eventCallbacks.get(eventType)

    if (!callbacks) {
      callbacks = []
      this.eventCallbacks.set(eventType, callbacks)
    }

    callbacks.push(callback)
  }

  /**
   * Unsubscribe from event
   */
  public off(eventType: MatchmakingEventType, callback: (event: MatchmakingEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)

    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch event
   */
  private dispatchEvent(event: MatchmakingEvent): void {
    const callbacks = this.eventCallbacks.get(event.type)

    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event)
        } catch (error) {
          console.error('[Matchmaking] Event callback error:', error)
        }
      }
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopQueueTimer()
    this.stopAcceptTimer()
    this.currentTicket = null
    this.pendingMatch = null
    this.queueStartTime = 0
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getCurrentTicket(): MatchmakingTicket | null {
    return this.currentTicket
  }

  public getPendingMatch(): MatchFoundData | null {
    return this.pendingMatch
  }

  public getPlayerRating(): PlayerRating | null {
    return this.playerRating ? { ...this.playerRating } : null
  }

  public getQueueTime(): number {
    if (!this.queueStartTime) return 0
    return Date.now() - this.queueStartTime
  }

  public getEstimatedWaitTime(): number {
    return this.estimatedWaitTime
  }

  public isInQueue(): boolean {
    return this.currentTicket !== null && this.currentTicket.status === 'searching'
  }

  public hasMatchFound(): boolean {
    return this.pendingMatch !== null
  }

  /**
   * Dispose matchmaking
   */
  public dispose(): void {
    this.cleanup()
    this.eventCallbacks.clear()
    this.queueStats.clear()
  }
}
