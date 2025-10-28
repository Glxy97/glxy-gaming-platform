// @ts-nocheck
/**
 * Anti-Cheat System
 * Rate-Limiting und Anomalie-Erkennung für Gaming-Plattform
 */

import { Redis } from 'ioredis'
import { AuditLogger } from '@/lib/audit-logger'

export interface CheatDetectionResult {
  suspicious: boolean
  cheatScore: number
  reasons: string[]
  action?: 'warn' | 'kick' | 'temp_ban' | 'ban'
  confidence: number // 0-100
}

export interface MoveData {
  gameType: string
  moveType: string
  timestamp: number
  playerId: string
  gameId: string
  moveData: any
  reactionTime?: number
  score?: number
}

export interface PlayerStats {
  averageReactionTime: number
  movesPerSecond: number
  suspiciousMoves: number
  totalMoves: number
  lastMoveTime: number
  cheatScore: number
  warnings: number
  kicks: number
  bans: number
}

export class AntiCheatSystem {
  private static redis: Redis | null = null
  private static readonly CHEAT_THRESHOLDS = {
    MAX_MOVES_PER_SECOND: 10,
    MIN_REACTION_TIME: 50, // ms
    MAX_SCORE_SPIKE: 1000,
    SUSPICIOUS_PATTERN_THRESHOLD: 5,
    CHEAT_SCORE_LIMITS: {
      WARN: 30,
      KICK: 60,
      TEMP_BAN: 80,
      BAN: 100
    }
  }

  /**
   * Initialize Redis connection
   */
  static initialize(redisClient: Redis) {
    this.redis = redisClient
  }

  /**
   * Analyze a game move for cheating
   */
  static async analyzeMove(moveData: MoveData): Promise<CheatDetectionResult> {
    if (!this.redis) {
      throw new Error('AntiCheatSystem not initialized')
    }

    const reasons: string[] = []
    let cheatScore = 0
    let confidence = 0

    try {
      // Get player stats
      const playerStats = await this.getPlayerStats(moveData.playerId)
      
      // Rate limiting check
      const rateLimitResult = await this.checkRateLimit(moveData, playerStats)
      if (rateLimitResult.suspicious) {
        reasons.push(...rateLimitResult.reasons)
        cheatScore += rateLimitResult.score
        confidence += rateLimitResult.confidence
      }

      // Reaction time analysis
      const reactionResult = await this.analyzeReactionTime(moveData, playerStats)
      if (reactionResult.suspicious) {
        reasons.push(...reactionResult.reasons)
        cheatScore += reactionResult.score
        confidence += reactionResult.confidence
      }

      // Score spike detection
      const scoreResult = await this.analyzeScoreSpike(moveData, playerStats)
      if (scoreResult.suspicious) {
        reasons.push(...scoreResult.reasons)
        cheatScore += scoreResult.score
        confidence += scoreResult.confidence
      }

      // Pattern analysis
      const patternResult = await this.analyzePatterns(moveData, playerStats)
      if (patternResult.suspicious) {
        reasons.push(...patternResult.reasons)
        cheatScore += patternResult.score
        confidence += patternResult.confidence
      }

      // Update player stats
      await this.updatePlayerStats(moveData.playerId, moveData)

      // Determine action
      const action = this.determineAction(cheatScore, playerStats)

      // Log cheat detection events
      if (cheatScore > this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.WARN) {
        await AuditLogger.logGameAction(
          'CHEAT_DETECTED',
          {
            userId: moveData.playerId,
            sessionId: undefined, // Would need to be passed from context
            ipAddress: undefined,  // Would need to be passed from context
            userAgent: undefined   // Would need to be passed from context
          },
          moveData.gameId,
          {
            gameType: moveData.gameType,
            moveType: moveData.moveType,
            cheatScore,
            reasons,
            action,
            confidence: Math.min(confidence, 100),
            reactionTime: moveData.reactionTime
          }
        )
      }

      return {
        suspicious: cheatScore > this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.WARN,
        cheatScore,
        reasons,
        action,
        confidence: Math.min(confidence, 100)
      }
    } catch (error) {
      console.error('Anti-cheat analysis error:', error)
      return {
        suspicious: false,
        cheatScore: 0,
        reasons: ['Analysis error'],
        confidence: 0
      }
    }
  }

  /**
   * Check rate limiting
   */
  private static async checkRateLimit(moveData: MoveData, playerStats: PlayerStats): Promise<CheatDetectionResult> {
    const reasons: string[] = []
    let score = 0
    let confidence = 0

    // Calculate moves per second
    const timeDiff = moveData.timestamp - playerStats.lastMoveTime
    const movesPerSecond = timeDiff > 0 ? 1000 / timeDiff : 0

    if (movesPerSecond > this.CHEAT_THRESHOLDS.MAX_MOVES_PER_SECOND) {
      reasons.push(`Excessive move rate: ${movesPerSecond.toFixed(2)} moves/sec`)
      score += 25
      confidence += 40
    }

    // Check for burst patterns
    const recentMoves = await this.getRecentMoves(moveData.playerId, 5)
    if (recentMoves.length >= 4) {
      const avgInterval = recentMoves.reduce((sum, move, index) => {
        if (index === 0) return sum
        return sum + (move.timestamp - recentMoves[index - 1].timestamp)
      }, 0) / (recentMoves.length - 1)

      if (avgInterval < 100) { // Less than 100ms between moves
        reasons.push('Burst move pattern detected')
        score += 20
        confidence += 30
      }
    }

    return {
      suspicious: reasons.length > 0,
      cheatScore: score,
      reasons,
      confidence
    }
  }

  /**
   * Analyze reaction time
   */
  private static async analyzeReactionTime(moveData: MoveData, playerStats: PlayerStats): Promise<CheatDetectionResult> {
    const reasons: string[] = []
    let score = 0
    let confidence = 0

    if (moveData.reactionTime !== undefined) {
      // Check for impossibly fast reactions
      if (moveData.reactionTime < this.CHEAT_THRESHOLDS.MIN_REACTION_TIME) {
        reasons.push(`Impossibly fast reaction: ${moveData.reactionTime}ms`)
        score += 30
        confidence += 50
      }

      // Check for consistent perfect timing
      const recentReactions = await this.getRecentReactionTimes(moveData.playerId, 10)
      if (recentReactions.length >= 5) {
        const variance = this.calculateVariance(recentReactions)
        if (variance < 10) { // Very low variance suggests automation
          reasons.push('Consistent perfect timing detected')
          score += 15
          confidence += 25
        }
      }
    }

    return {
      suspicious: reasons.length > 0,
      cheatScore: score,
      reasons,
      confidence
    }
  }

  /**
   * Analyze score spikes
   */
  private static async analyzeScoreSpike(moveData: MoveData, playerStats: PlayerStats): Promise<CheatDetectionResult> {
    const reasons: string[] = []
    let score = 0
    let confidence = 0

    if (moveData.score !== undefined) {
      const recentScores = await this.getRecentScores(moveData.playerId, 5)
      if (recentScores.length > 0) {
        const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
        const scoreIncrease = moveData.score - avgScore

        if (scoreIncrease > this.CHEAT_THRESHOLDS.MAX_SCORE_SPIKE) {
          reasons.push(`Suspicious score spike: +${scoreIncrease}`)
          score += 20
          confidence += 35
        }
      }
    }

    return {
      suspicious: reasons.length > 0,
      cheatScore: score,
      reasons,
      confidence
    }
  }

  /**
   * Analyze movement patterns
   */
  private static async analyzePatterns(moveData: MoveData, playerStats: PlayerStats): Promise<CheatDetectionResult> {
    const reasons: string[] = []
    let score = 0
    let confidence = 0

    // Check for repetitive patterns
    const recentMoves = await this.getRecentMoves(moveData.playerId, 20)
    if (recentMoves.length >= 10) {
      const patterns = this.detectRepetitivePatterns(recentMoves)
      if (patterns.length > 0) {
        reasons.push(`Repetitive patterns detected: ${patterns.length}`)
        score += 15
        confidence += 20
      }
    }

    // Check for impossible moves (game-specific)
    const impossibleMove = await this.checkImpossibleMove(moveData)
    if (impossibleMove) {
      reasons.push('Impossible move detected')
      score += 40
      confidence += 60
    }

    return {
      suspicious: reasons.length > 0,
      cheatScore: score,
      reasons,
      confidence
    }
  }

  /**
   * Get player statistics
   */
  private static async getPlayerStats(playerId: string): Promise<PlayerStats> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `player_stats:${playerId}`
    const stats = await this.redis.hgetall(key)

    return {
      averageReactionTime: parseFloat(stats.averageReactionTime || '200'),
      movesPerSecond: parseFloat(stats.movesPerSecond || '2'),
      suspiciousMoves: parseInt(stats.suspiciousMoves || '0'),
      totalMoves: parseInt(stats.totalMoves || '0'),
      lastMoveTime: parseInt(stats.lastMoveTime || '0'),
      cheatScore: parseInt(stats.cheatScore || '0'),
      warnings: parseInt(stats.warnings || '0'),
      kicks: parseInt(stats.kicks || '0'),
      bans: parseInt(stats.bans || '0')
    }
  }

  /**
   * Update player statistics
   */
  private static async updatePlayerStats(playerId: string, moveData: MoveData): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `player_stats:${playerId}`
    const stats = await this.getPlayerStats(playerId)

    // Update basic stats
    const updates: Record<string, string> = {
      totalMoves: (stats.totalMoves + 1).toString(),
      lastMoveTime: moveData.timestamp.toString()
    }

    // Update reaction time average
    if (moveData.reactionTime !== undefined) {
      const newAvg = (stats.averageReactionTime * stats.totalMoves + moveData.reactionTime) / (stats.totalMoves + 1)
      updates.averageReactionTime = newAvg.toString()
    }

    // Update moves per second
    if (stats.lastMoveTime > 0) {
      const timeDiff = moveData.timestamp - stats.lastMoveTime
      const currentMPS = timeDiff > 0 ? 1000 / timeDiff : 0
      const newAvgMPS = (stats.movesPerSecond * stats.totalMoves + currentMPS) / (stats.totalMoves + 1)
      updates.movesPerSecond = newAvgMPS.toString()
    }

    await this.redis.hset(key, updates)

    // Store move history (keep last 50 moves)
    const historyKey = `move_history:${playerId}`
    await this.redis.lpush(historyKey, JSON.stringify(moveData))
    await this.redis.ltrim(historyKey, 0, 49)
    await this.redis.expire(historyKey, 3600) // 1 hour TTL
  }

  /**
   * Get recent moves
   */
  private static async getRecentMoves(playerId: string, count: number): Promise<MoveData[]> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `move_history:${playerId}`
    const moves = await this.redis.lrange(key, 0, count - 1)
    
    return moves.map(move => JSON.parse(move))
  }

  /**
   * Get recent reaction times
   */
  private static async getRecentReactionTimes(playerId: string, count: number): Promise<number[]> {
    const moves = await this.getRecentMoves(playerId, count)
    return moves
      .map(move => move.reactionTime)
      .filter(time => time !== undefined) as number[]
  }

  /**
   * Get recent scores
   */
  private static async getRecentScores(playerId: string, count: number): Promise<number[]> {
    const moves = await this.getRecentMoves(playerId, count)
    return moves
      .map(move => move.score)
      .filter(score => score !== undefined) as number[]
  }

  /**
   * Calculate variance
   */
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  /**
   * Detect repetitive patterns
   */
  private static detectRepetitivePatterns(moves: MoveData[]): string[] {
    const patterns: string[] = []
    
    // Simple pattern detection - look for repeated sequences
    for (let i = 0; i < moves.length - 6; i++) {
      const sequence = moves.slice(i, i + 3).map(m => m.moveType).join(',')
      let repetitions = 1
      
      for (let j = i + 3; j < moves.length - 2; j += 3) {
        const nextSequence = moves.slice(j, j + 3).map(m => m.moveType).join(',')
        if (sequence === nextSequence) {
          repetitions++
        } else {
          break
        }
      }
      
      if (repetitions >= 3) {
        patterns.push(`Pattern "${sequence}" repeated ${repetitions} times`)
      }
    }
    
    return patterns
  }

  /**
   * Check for impossible moves (game-specific)
   */
  private static async checkImpossibleMove(moveData: MoveData): Promise<boolean> {
    // This would be implemented with game-specific validators
    // For now, return false as a placeholder
    return false
  }

  /**
   * Determine action based on cheat score
   */
  private static determineAction(cheatScore: number, playerStats: PlayerStats): 'warn' | 'kick' | 'temp_ban' | 'ban' | undefined {
    if (cheatScore >= this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.BAN) {
      return 'ban'
    } else if (cheatScore >= this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.TEMP_BAN) {
      return 'temp_ban'
    } else if (cheatScore >= this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.KICK) {
      return 'kick'
    } else if (cheatScore >= this.CHEAT_THRESHOLDS.CHEAT_SCORE_LIMITS.WARN) {
      return 'warn'
    }
    
    return undefined
  }

  /**
   * Update cheat score for a player
   */
  static async updateCheatScore(playerId: string, points: number, reason: string): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `player_stats:${playerId}`
    const stats = await this.getPlayerStats(playerId)
    
    const newScore = Math.min(stats.cheatScore + points, 100)
    await this.redis.hset(key, 'cheatScore', newScore.toString())

    // Log the reason
    const logKey = `cheat_log:${playerId}`
    await this.redis.lpush(logKey, JSON.stringify({
      timestamp: Date.now(),
      points,
      reason,
      totalScore: newScore
    }))
    await this.redis.ltrim(logKey, 0, 99) // Keep last 100 entries
    await this.redis.expire(logKey, 86400) // 24 hours TTL
  }

  /**
   * Reset player cheat score
   */
  static async resetCheatScore(playerId: string): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `player_stats:${playerId}`
    await this.redis.hset(key, 'cheatScore', '0')
    await this.redis.hset(key, 'warnings', '0')
    await this.redis.hset(key, 'kicks', '0')
  }

  /**
   * Get cheat log for a player
   */
  static async getCheatLog(playerId: string, count: number = 20): Promise<any[]> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `cheat_log:${playerId}`
    const logs = await this.redis.lrange(key, 0, count - 1)
    
    return logs.map(log => JSON.parse(log))
  }

  /**
   * Check if player is banned
   */
  static async isPlayerBanned(playerId: string): Promise<boolean> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `ban_status:${playerId}`
    const banData = await this.redis.get(key)
    
    if (!banData) return false
    
    const ban = JSON.parse(banData)
    
    // Check if ban is still active
    if (ban.type === 'permanent') {
      return true
    } else if (ban.type === 'temporary' && ban.expiresAt > Date.now()) {
      return true
    } else {
      // Ban expired, remove it
      await this.redis.del(key)
      return false
    }
  }

  /**
   * Ban a player
   */
  static async banPlayer(playerId: string, type: 'temporary' | 'permanent', duration?: number): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `ban_status:${playerId}`
    const banData = {
      type,
      bannedAt: Date.now(),
      expiresAt: type === 'temporary' && duration ? Date.now() + duration : null
    }

    await this.redis.set(key, JSON.stringify(banData))
    
    if (type === 'temporary' && duration) {
      await this.redis.expire(key, Math.floor(duration / 1000))
    }
  }

  /**
   * Unban a player
   */
  static async unbanPlayer(playerId: string): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized')

    const key = `ban_status:${playerId}`
    await this.redis.del(key)
  }
}
