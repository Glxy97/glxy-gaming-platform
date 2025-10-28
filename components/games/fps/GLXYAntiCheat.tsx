// @ts-nocheck
'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Interfaces für Anti-Cheat System
export interface PlayerValidation {
  playerId: string
  timestamp: number
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  ammo: number
  score: number
  actions: PlayerAction[]
  networkStats: {
    ping: number
    packetLoss: number
    jitter: number
  }
}

export interface PlayerAction {
  type: 'move' | 'shoot' | 'jump' | 'reload' | 'use_ability' | 'damage' | 'kill'
  timestamp: number
  data: any
  validated: boolean
  suspicious: boolean
  riskScore: number
}

export interface CheatDetection {
  type: 'aimbot' | 'wallhack' | 'speedhack' | 'flyhack' | 'damage_hack' | 'ammo_hack' | 'radar' | 'macro'
  confidence: number
  evidence: any[]
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ValidationResult {
  isValid: boolean
  riskScore: number
  violations: CheatDetection[]
  recommendations: string[]
  requiresAction: boolean
}

export interface AntiCheatConfig {
  enabled: boolean
  strictMode: boolean
  autoBan: boolean
  banThreshold: number
  monitoringLevel: 'basic' | 'standard' | 'aggressive' | 'paranoid'
  validationChecks: {
    positionValidation: boolean
    movementValidation: boolean
    combatValidation: boolean
    resourceValidation: boolean
    networkValidation: boolean
    behaviorValidation: boolean
  }
  thresholds: {
    maxSpeed: number
    maxRotationSpeed: number
    maxJumpHeight: number
    maxDamagePerSecond: number
    maxHeadshotAccuracy: number
    maxReactionTime: number
    suspiciousKillDistance: number
    impossibleActions: number
  }
}

// Haupt Anti-Cheat Klasse
export class GLXYAntiCheat {
  private config: AntiCheatConfig
  private playerData: Map<string, PlayerValidation[]> = new Map()
  private detections: Map<string, CheatDetection[]> = new Map()
  private bannedPlayers: Set<string> = new Set()
  private suspiciousPlayers: Map<string, number> = new Map()

  // Analyse-Module
  private movementAnalyzer: MovementAnalyzer
  private combatAnalyzer: CombatAnalyzer
  private networkAnalyzer: NetworkAnalyzer
  private behaviorAnalyzer: BehaviorAnalyzer

  // Statistiken
  private stats = {
    totalValidations: 0,
    suspiciousDetections: 0,
    playersBanned: 0,
    falsePositives: 0,
    averageProcessingTime: 0,
    detectionAccuracy: 0
  }

  constructor(config: Partial<AntiCheatConfig> = {}) {
    this.config = {
      enabled: true,
      strictMode: false,
      autoBan: false,
      banThreshold: 100,
      monitoringLevel: 'standard',
      validationChecks: {
        positionValidation: true,
        movementValidation: true,
        combatValidation: true,
        resourceValidation: true,
        networkValidation: true,
        behaviorValidation: true
      },
      thresholds: {
        maxSpeed: 15,
        maxRotationSpeed: 720,
        maxJumpHeight: 2.5,
        maxDamagePerSecond: 500,
        maxHeadshotAccuracy: 0.85,
        maxReactionTime: 150,
        suspiciousKillDistance: 100,
        impossibleActions: 3
      },
      ...config
    }

    this.movementAnalyzer = new MovementAnalyzer(this.config.thresholds)
    this.combatAnalyzer = new CombatAnalyzer(this.config.thresholds)
    this.networkAnalyzer = new NetworkAnalyzer()
    this.behaviorAnalyzer = new BehaviorAnalyzer()
  }

  public validatePlayer(playerData: PlayerValidation): ValidationResult {
    if (!this.config.enabled || this.bannedPlayers.has(playerData.playerId)) {
      return {
        isValid: true,
        riskScore: 0,
        violations: [],
        recommendations: [],
        requiresAction: false
      }
    }

    const startTime = performance.now()
    const violations: CheatDetection[] = []
    let totalRiskScore = 0

    // Spielerdaten speichern
    this.storePlayerData(playerData)

    // Positions-Validierung
    if (this.config.validationChecks.positionValidation) {
      const positionResult = this.validatePosition(playerData)
      if (positionResult.length > 0) {
        violations.push(...positionResult)
      }
    }

    // Bewegungs-Validierung
    if (this.config.validationChecks.movementValidation) {
      const movementResult = this.movementAnalyzer.analyze(playerData, this.getPlayerHistory(playerData.playerId))
      if (movementResult.length > 0) {
        violations.push(...movementResult)
      }
    }

    // Kampf-Validierung
    if (this.config.validationChecks.combatValidation) {
      const combatResult = this.combatAnalyzer.analyze(playerData, this.getPlayerHistory(playerData.playerId))
      if (combatResult.length > 0) {
        violations.push(...combatResult)
      }
    }

    // Netzwerk-Validierung
    if (this.config.validationChecks.networkValidation) {
      const networkResult = this.networkAnalyzer.analyze(playerData.networkStats)
      if (networkResult.length > 0) {
        violations.push(...networkResult)
      }
    }

    // Verhaltens-Validierung
    if (this.config.validationChecks.behaviorValidation) {
      const behaviorResult = this.behaviorAnalyzer.analyze(playerData, this.getPlayerHistory(playerData.playerId))
      if (behaviorResult.length > 0) {
        violations.push(...behaviorResult)
      }
    }

    // Risiko-Score berechnen
    violations.forEach(violation => {
      totalRiskScore += this.calculateRiskScore(violation)
    })

    // Verdächtige Spieler verfolgen
    if (totalRiskScore > 20) {
      this.suspiciousPlayers.set(playerData.playerId, totalRiskScore)
    }

    // Auto-Ban bei Überschreitung der Schwelle
    if (this.config.autoBan && totalRiskScore >= this.config.banThreshold) {
      this.banPlayer(playerData.playerId, totalRiskScore, violations)
    }

    // Statistiken aktualisieren
    const processingTime = performance.now() - startTime
    this.stats.totalValidations++
    this.stats.averageProcessingTime = (this.stats.averageProcessingTime + processingTime) / 2

    if (violations.length > 0) {
      this.stats.suspiciousDetections++
      this.storeDetections(playerData.playerId, violations)
    }

    const requiresAction = totalRiskScore >= this.config.banThreshold * 0.7

    return {
      isValid: violations.length === 0 || !this.config.strictMode,
      riskScore: totalRiskScore,
      violations,
      recommendations: this.generateRecommendations(violations),
      requiresAction
    }
  }

  public banPlayer(playerId: string, riskScore: number, violations: CheatDetection[]): void {
    this.bannedPlayers.add(playerId)
    this.stats.playersBanned++

    console.warn(`🚫 Player ${playerId} banned! Risk Score: ${riskScore}, Violations:`, violations)

    // Ban-Event senden
    this.onPlayerBanned?.(playerId, riskScore, violations)
  }

  public isPlayerBanned(playerId: string): boolean {
    return this.bannedPlayers.has(playerId)
  }

  public getPlayerRiskScore(playerId: string): number {
    return this.suspiciousPlayers.get(playerId) || 0
  }

  public getSuspiciousPlayers(): Array<{ playerId: string; riskScore: number }> {
    return Array.from(this.suspiciousPlayers.entries())
      .map(([playerId, riskScore]) => ({ playerId, riskScore }))
      .sort((a, b) => b.riskScore - a.riskScore)
  }

  public getDetections(playerId?: string): CheatDetection[] {
    if (playerId) {
      return this.detections.get(playerId) || []
    }
    return Array.from(this.detections.values()).flat()
  }

  public getStats() {
    return { ...this.stats }
  }

  public updateConfig(newConfig: Partial<AntiCheatConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Thresholds für Analyse-Module aktualisieren
    if (newConfig.thresholds) {
      this.movementAnalyzer.updateThresholds(newConfig.thresholds)
      this.combatAnalyzer.updateThresholds(newConfig.thresholds)
    }
  }

  public generateReport(playerId: string): any {
    const history = this.getPlayerHistory(playerId)
    const detections = this.getDetections(playerId)
    const riskScore = this.getPlayerRiskScore(playerId)

    return {
      playerId,
      riskScore,
      isBanned: this.isPlayerBanned(playerId),
      totalValidations: history.length,
      detections: detections.length,
      detectionTypes: detections.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
      recommendations: this.generateRecommendations(detections)
    }
  }

  // Private Methoden
  private storePlayerData(data: PlayerValidation): void {
    if (!this.playerData.has(data.playerId)) {
      this.playerData.set(data.playerId, [])
    }

    const history = this.playerData.get(data.playerId)!
    history.push(data)

    // Nur die letzten 100 Validierungen behalten
    if (history.length > 100) {
      history.shift()
    }
  }

  private getPlayerHistory(playerId: string): PlayerValidation[] {
    return this.playerData.get(playerId) || []
  }

  private storeDetections(playerId: string, detections: CheatDetection[]): void {
    if (!this.detections.has(playerId)) {
      this.detections.set(playerId, [])
    }

    const playerDetections = this.detections.get(playerId)!
    playerDetections.push(...detections)

    // Nur die letzten 50 Detections behalten
    if (playerDetections.length > 50) {
      playerDetections.splice(0, playerDetections.length - 50)
    }
  }

  private validatePosition(data: PlayerValidation): CheatDetection[] {
    const violations: CheatDetection[] = []

    // Grundlegende Positions-Validierung
    if (isNaN(data.position.x) || isNaN(data.position.y) || isNaN(data.position.z)) {
      violations.push({
        type: 'flyhack',
        confidence: 0.9,
        evidence: [`Invalid position coordinates: ${data.position.x}, ${data.position.y}, ${data.position.z}`],
        timestamp: data.timestamp,
        severity: 'critical'
      })
    }

    // Unterwelt-Detektion
    if (data.position.y < -100) {
      violations.push({
        type: 'flyhack',
        confidence: 0.8,
        evidence: [`Player below world: Y=${data.position.y}`],
        timestamp: data.timestamp,
        severity: 'high'
      })
    }

    return violations
  }

  private calculateRiskScore(detection: CheatDetection): number {
    let baseScore = 0

    switch (detection.type) {
      case 'aimbot':
        baseScore = 30
        break
      case 'wallhack':
        baseScore = 25
        break
      case 'speedhack':
        baseScore = 35
        break
      case 'flyhack':
        baseScore = 40
        break
      case 'damage_hack':
        baseScore = 30
        break
      case 'ammo_hack':
        baseScore = 20
        break
      case 'radar':
        baseScore = 15
        break
      case 'macro':
        baseScore = 10
        break
    }

    // Confidence multiplier
    baseScore *= detection.confidence

    // Severity multiplier
    switch (detection.severity) {
      case 'critical':
        baseScore *= 2.0
        break
      case 'high':
        baseScore *= 1.5
        break
      case 'medium':
        baseScore *= 1.0
        break
      case 'low':
        baseScore *= 0.5
        break
    }

    return Math.round(baseScore)
  }

  private generateRecommendations(violations: CheatDetection[]): string[] {
    const recommendations: string[] = []

    if (violations.some(v => v.type === 'aimbot')) {
      recommendations.push('Review player aim patterns and crosshair placement')
    }

    if (violations.some(v => v.type === 'wallhack')) {
      recommendations.push('Analyze player awareness of enemy positions through walls')
    }

    if (violations.some(v => v.type === 'speedhack')) {
      recommendations.push('Check player movement speed and teleportation instances')
    }

    if (violations.some(v => v.severity === 'critical')) {
      recommendations.push('IMMEDIATE ACTION REQUIRED - Critical violations detected')
    }

    if (violations.length > 5) {
      recommendations.push('Multiple violation types suggest sophisticated cheating')
    }

    return recommendations
  }

  public onPlayerBanned?: (playerId: string, riskScore: number, violations: CheatDetection[]) => void
}

// Bewegungs-Analyse
class MovementAnalyzer {
  constructor(private thresholds: any) {}

  public analyze(data: PlayerValidation, history: PlayerValidation[]): CheatDetection[] {
    const violations: CheatDetection[] = []

    if (history.length < 2) return violations

    const prevData = history[history.length - 2]
    const timeDelta = (data.timestamp - prevData.timestamp) / 1000

    if (timeDelta <= 0) return violations

    // Geschwindigkeits-Validierung
    const positionDelta = data.position.distanceTo(prevData.position)
    const speed = positionDelta / timeDelta

    if (speed > this.thresholds.maxSpeed) {
      violations.push({
        type: 'speedhack',
        confidence: Math.min(0.9, speed / this.thresholds.maxSpeed - 1),
        evidence: [`Speed: ${speed.toFixed(2)} units/s (max: ${this.thresholds.maxSpeed})`],
        timestamp: data.timestamp,
        severity: speed > this.thresholds.maxSpeed * 2 ? 'critical' : 'high'
      })
    }

    // Rotations-Validierung
    const rotationDelta = Math.abs(data.rotation.y - prevData.rotation.y)
    const rotationSpeed = Math.abs((rotationDelta * 180 / Math.PI) / timeDelta)

    if (rotationSpeed > this.thresholds.maxRotationSpeed) {
      violations.push({
        type: 'aimbot',
        confidence: Math.min(0.8, rotationSpeed / this.thresholds.maxRotationSpeed - 1),
        evidence: [`Rotation speed: ${rotationSpeed.toFixed(2)}°/s (max: ${this.thresholds.maxRotationSpeed})`],
        timestamp: data.timestamp,
        severity: 'medium'
      })
    }

    // Sprung-Validierung
    const jumpActions = data.actions.filter(a => a.type === 'jump')
    if (jumpActions.length > 0) {
      const jump = jumpActions[jumpActions.length - 1]
      if (jump.data.height > this.thresholds.maxJumpHeight) {
        violations.push({
          type: 'flyhack',
          confidence: 0.7,
          evidence: [`Jump height: ${jump.data.height}m (max: ${this.thresholds.maxJumpHeight})`],
          timestamp: data.timestamp,
          severity: 'medium'
        })
      }
    }

    return violations
  }

  public updateThresholds(thresholds: any): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }
}

// Kampf-Analyse
class CombatAnalyzer {
  constructor(private thresholds: any) {}

  public analyze(data: PlayerValidation, history: PlayerValidation[]): CheatDetection[] {
    const violations: CheatDetection[] = []

    // Schaden pro Sekunde
    const damageActions = data.actions.filter(a => a.type === 'damage')
    if (damageActions.length > 0) {
      const recentDamage = damageActions
        .filter(a => data.timestamp - a.timestamp < 1000)
        .reduce((sum, a) => sum + (a.data.damage || 0), 0)

      if (recentDamage > this.thresholds.maxDamagePerSecond) {
        violations.push({
          type: 'damage_hack',
          confidence: Math.min(0.9, recentDamage / this.thresholds.maxDamagePerSecond - 1),
          evidence: [`Damage per second: ${recentDamage} (max: ${this.thresholds.maxDamagePerSecond})`],
          timestamp: data.timestamp,
          severity: 'high'
        })
      }
    }

    // Headshot-Genauigkeit
    const killActions = data.actions.filter(a => a.type === 'kill')
    if (killActions.length > 5) {
      const headshotKills = killActions.filter(k => k.data.headshot).length
      const accuracy = headshotKills / killActions.length

      if (accuracy > this.thresholds.maxHeadshotAccuracy) {
        violations.push({
          type: 'aimbot',
          confidence: Math.min(0.8, accuracy / this.thresholds.maxHeadshotAccuracy - 1),
          evidence: [`Headshot accuracy: ${(accuracy * 100).toFixed(1)}% (max: ${(this.thresholds.maxHeadshotAccuracy * 100).toFixed(1)}%)`],
          timestamp: data.timestamp,
          severity: 'high'
        })
      }
    }

    // Verdächtige Tötungsentfernungen
    killActions.forEach(kill => {
      if (kill.data.distance > this.thresholds.suspiciousKillDistance) {
        violations.push({
          type: 'wallhack',
          confidence: 0.6,
          evidence: [`Kill distance: ${kill.data.distance}m (suspicious: >${this.thresholds.suspiciousKillDistance}m)`],
          timestamp: data.timestamp,
          severity: 'medium'
        })
      }
    })

    return violations
  }

  public updateThresholds(thresholds: any): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }
}

// Netzwerk-Analyse
class NetworkAnalyzer {
  public analyze(networkStats: any): CheatDetection[] {
    const violations: CheatDetection[] = []

    // Paketverlust
    if (networkStats.packetLoss > 20) {
      violations.push({
        type: 'speedhack',
        confidence: 0.5,
        evidence: [`Packet loss: ${networkStats.packetLoss}%`],
        timestamp: Date.now(),
        severity: 'low'
      })
    }

    // Jitter
    if (networkStats.jitter > 100) {
      violations.push({
        type: 'speedhack',
        confidence: 0.4,
        evidence: [`Jitter: ${networkStats.jitter}ms`],
        timestamp: Date.now(),
        severity: 'low'
      })
    }

    return violations
  }
}

// Verhaltens-Analyse
class BehaviorAnalyzer {
  public analyze(data: PlayerValidation, history: PlayerValidation[]): CheatDetection[] {
    const violations: CheatDetection[] = []

    // Häufigkeit der Aktionen analysieren
    const recentActions = data.actions.filter(a => data.timestamp - a.timestamp < 1000)

    if (recentActions.length > 20) {
      violations.push({
        type: 'macro',
        confidence: 0.7,
        evidence: [`Actions per second: ${recentActions.length} (suspicious: >20)`],
        timestamp: data.timestamp,
        severity: 'medium'
      })
    }

    return violations
  }
}

// React Hook für Anti-Cheat
export const useGLXYAntiCheat = (config?: Partial<AntiCheatConfig>) => {
  const [antiCheat] = useState(() => new GLXYAntiCheat(config))
  const [stats, setStats] = useState(antiCheat.getStats())
  const [suspiciousPlayers, setSuspiciousPlayers] = useState(antiCheat.getSuspiciousPlayers())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(antiCheat.getStats())
      setSuspiciousPlayers(antiCheat.getSuspiciousPlayers())
    }, 5000)

    return () => clearInterval(interval)
  }, [antiCheat])

  return {
    antiCheat,
    stats,
    suspiciousPlayers,
    validatePlayer: (data: PlayerValidation) => antiCheat.validatePlayer(data),
    banPlayer: (playerId: string, riskScore: number, violations: CheatDetection[]) =>
      antiCheat.banPlayer(playerId, riskScore, violations),
    isPlayerBanned: (playerId: string) => antiCheat.isPlayerBanned(playerId),
    generateReport: (playerId: string) => antiCheat.generateReport(playerId),
    updateConfig: (newConfig: Partial<AntiCheatConfig>) => antiCheat.updateConfig(newConfig)
  }
}

// Anti-Cheat UI Component
export const AntiCheatUI: React.FC<{
  antiCheat: GLXYAntiCheat
  stats: any
  suspiciousPlayers: Array<{ playerId: string; riskScore: number }>
}> = ({ antiCheat, stats, suspiciousPlayers }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500'
    if (score >= 50) return 'text-orange-500'
    if (score >= 20) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 backdrop-blur-md rounded-lg p-4 border border-red-500/30 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-red-400 font-bold flex items-center">
          🛡️ Anti-Cheat
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white text-sm"
        >
          {showDetails ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="text-xs text-gray-400 space-y-1 mb-3">
        <div>Validations: {stats.totalValidations}</div>
        <div>Suspicious: {stats.suspiciousDetections}</div>
        <div>Banned: {stats.playersBanned}</div>
        <div>Avg Processing: {stats.averageProcessingTime.toFixed(2)}ms</div>
      </div>

      {/* Suspicious Players */}
      {suspiciousPlayers.length > 0 && (
        <div className="mb-3">
          <div className="text-red-400 text-sm font-semibold mb-2">Suspicious Players:</div>
          {suspiciousPlayers.slice(0, 3).map(player => (
            <div key={player.playerId} className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-300 truncate">{player.playerId}</span>
              <span className={getRiskColor(player.riskScore)}>{player.riskScore}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {showDetails && selectedPlayer && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-2">
            Player Report: {selectedPlayer}
          </div>
          <div className="text-xs text-gray-400">
            {(() => {
              const report = antiCheat.generateReport(selectedPlayer)
              return (
                <div className="space-y-1">
                  <div>Risk Score: <span className={getRiskColor(report.riskScore)}>{report.riskScore}</span></div>
                  <div>Detections: {report.detections}</div>
                  <div>Status: {report.isBanned ? '🚫 Banned' : '⚠️ Monitored'}</div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => {
            suspiciousPlayers.slice(0, 3).forEach(player => {
              setSelectedPlayer(player.playerId)
            })
          }}
          className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Review Top 3
        </button>
      </div>
    </div>
  )
}

export default GLXYAntiCheat