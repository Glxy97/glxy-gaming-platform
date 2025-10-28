// @ts-nocheck
/**
 * GLXY Gaming Spectator Mode & Replay System
 * Features:
 * - Live spectating of ongoing games
 * - Replay recording and playback
 * - Multi-camera angles
 * - Timeline scrubbing
 * - Speed controls
 * - Statistics overlay
 * - Highlights detection
 * - Share functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Types
interface GameReplay {
  id: string
  gameId: string
  gameType: string
  players: SpectatorPlayer[]
  events: GameEvent[]
  startTime: number
  endTime: number
  duration: number
  winner?: string
  metadata: ReplayMetadata
}

interface SpectatorPlayer {
  id: string
  username: string
  avatar?: string
  team?: string
  score?: number
  stats?: any
  isActive: boolean
}

interface GameEvent {
  id: string
  timestamp: number
  type: 'move' | 'action' | 'score' | 'system' | 'highlight'
  playerId?: string
  data: any
  description: string
}

interface ReplayMetadata {
  title: string
  description?: string
  tags: string[]
  isPublic: boolean
  views: number
  likes: number
  createdAt: number
  recordedBy: string
  gameVersion: string
}

interface SpectatorSettings {
  showNames: boolean
  showStats: boolean
  showTimeline: boolean
  autoFollowHighlights: boolean
  preferredCamera: 'free' | 'follow' | 'player1' | 'player2'
  overlayOpacity: number
  delayMs: number // Spectator delay
}

interface CameraAngle {
  id: string
  name: string
  position: { x: number, y: number, z: number }
  target: { x: number, y: number, z: number }
  fov: number
}

// Spectator Mode Manager
export class SpectatorModeManager {
  private socket: any
  private spectators: Map<string, SpectatorPlayer> = new Map()
  private settings: SpectatorSettings
  private eventBuffer: GameEvent[] = []
  private highlightEvents: GameEvent[] = []
  private currentEventIndex = 0
  private isRecording = false
  private recordingStartTime = 0

  constructor(socket: any, settings: Partial<SpectatorSettings> = {}) {
    this.socket = socket
    this.settings = {
      showNames: true,
      showStats: true,
      showTimeline: true,
      autoFollowHighlights: true,
      preferredCamera: 'free',
      overlayOpacity: 0.8,
      delayMs: 30000, // 30 second delay for fairness
      ...settings
    }

    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    if (!this.socket) return

    this.socket.on('spectator:join', (data: any) => {
      this.handleSpectatorJoin(data)
    })

    this.socket.on('spectator:leave', (data: any) => {
      this.handleSpectatorLeave(data)
    })

    this.socket.on('game:event', (event: any) => {
      this.addGameEvent(event)
    })

    this.socket.on('spectator:highlight', (highlight: any) => {
      this.addHighlight(highlight)
    })

    this.socket.on('replay:available', (replay: any) => {
      this.handleReplayAvailable(replay)
    })
  }

  // Spectator Functions
  async joinSpectateRoom(roomId: string, gameId: string): Promise<boolean> {
    try {
      await this.socket.emit('spectator:join', { roomId, gameId })
      return true
    } catch (error) {
      console.error('Failed to join spectate room:', error)
      return false
    }
  }

  leaveSpectateRoom(): void {
    this.socket.emit('spectator:leave')
    this.spectators.clear()
    this.eventBuffer = []
  }

  private handleSpectatorJoin(data: any) {
    const spectator: SpectatorPlayer = {
      id: data.userId,
      username: data.username,
      avatar: data.avatar,
      isActive: true
    }

    this.spectators.set(spectator.id, spectator)
  }

  private handleSpectatorLeave(data: any) {
    this.spectators.delete(data.userId)
  }

  // Replay Functions
  startRecording(gameId: string, players: SpectatorPlayer[]): void {
    this.isRecording = true
    this.recordingStartTime = Date.now()
    this.eventBuffer = []

    // Add initial setup event
    this.addGameEvent({
      type: 'system',
      data: { gameId, players },
      description: 'Game started'
    })
  }

  stopRecording(): GameReplay | null {
    if (!this.isRecording) return null

    this.isRecording = false
    const endTime = Date.now()
    const duration = endTime - this.recordingStartTime

    const replay: GameReplay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId: `game_${Date.now()}`,
      gameType: 'unknown', // Would be determined by game context
      players: Array.from(this.spectators.values()),
      events: [...this.eventBuffer],
      startTime: this.recordingStartTime,
      endTime,
      duration,
      metadata: {
        title: `Game Replay - ${new Date().toLocaleDateString()}`,
        description: 'Auto-recorded game replay',
        tags: ['replay', 'auto'],
        isPublic: false,
        views: 0,
        likes: 0,
        createdAt: Date.now(),
        recordedBy: 'system',
        gameVersion: '1.0.0'
      }
    }

    this.socket.emit('replay:save', replay)
    return replay
  }

  private addGameEvent(event: Omit<GameEvent, 'id' | 'timestamp'>): void {
    if (!this.isRecording) return

    const fullEvent: GameEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now() - this.recordingStartTime,
      ...event
    }

    this.eventBuffer.push(fullEvent)

    // Check if this is a highlight-worthy event
    if (this.isHighlightEvent(fullEvent)) {
      this.addHighlight(fullEvent)
    }
  }

  private isHighlightEvent(event: GameEvent): boolean {
    switch (event.type) {
      case 'score':
        return event.data.points > 100 // High score events
      case 'action':
        return event.data.isCritical || event.data.isCombo
      case 'move':
        return event.data.isCheckmate || event.data.isGameWinning
      default:
        return false
    }
  }

  private addHighlight(event: GameEvent): void {
    this.highlightEvents.push(event)
    this.socket.emit('spectator:highlight', event)
  }

  private handleReplayAvailable(replay: GameReplay): void {
    // Notify user that replay is available
    console.log('Replay available:', replay.id)
  }

  // Camera Management
  getCameraAngles(gameType: string): CameraAngle[] {
    const baseAngles: CameraAngle[] = [
      { id: 'free', name: 'Free Camera', position: { x: 0, y: 10, z: 20 }, target: { x: 0, y: 0, z: 0 }, fov: 75 },
      { id: 'overview', name: 'Overview', position: { x: 0, y: 30, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 90 },
      { id: 'cinematic', name: 'Cinematic', position: { x: 15, y: 8, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 60 }
    ]

    switch (gameType) {
      case 'FPS':
        return [
          ...baseAngles,
          { id: 'firstperson', name: 'First Person POV', position: { x: 0, y: 1.6, z: 0 }, target: { x: 5, y: 1.6, z: 0 }, fov: 90 },
          { id: 'thirdperson', name: 'Third Person', position: { x: -3, y: 2, z: 3 }, target: { x: 0, y: 1, z: 0 }, fov: 75 }
        ]
      case 'TETRIS':
        return [
          ...baseAngles,
          { id: 'sideview', name: 'Side View', position: { x: 25, y: 10, z: 0 }, target: { x: 0, y: 5, z: 0 }, fov: 60 },
          { id: 'topdown', name: 'Top Down', position: { x: 0, y: 40, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 45 }
        ]
      case 'CHESS':
        return [
          ...baseAngles,
          { id: 'board', name: 'Board Level', position: { x: 0, y: 15, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
          { id: 'player1', name: 'White Side', position: { x: -10, y: 8, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
          { id: 'player2', name: 'Black Side', position: { x: 10, y: 8, z: -10 }, target: { x: 0, y: 0, z: 0 }, fov: 60 }
        ]
      default:
        return baseAngles
    }
  }

  // Statistics and Analytics
  generateHighlights(events: GameEvent[]): GameEvent[] {
    return events
      .filter(event => this.isHighlightEvent(event))
      .sort((a, b) => {
        // Score highlights by importance
        const scoreA = this.getHighlightScore(a)
        const scoreB = this.getHighlightScore(b)
        return scoreB - scoreA
      })
      .slice(0, 10) // Top 10 highlights
  }

  private getHighlightScore(event: GameEvent): number {
    let score = 0

    switch (event.type) {
      case 'score':
        score = event.data.points || 0
        break
      case 'action':
        if (event.data.isCritical) score += 100
        if (event.data.isCombo) score += event.data.comboCount * 20
        break
      case 'move':
        if (event.data.isCheckmate) score += 500
        if (event.data.isGameWinning) score += 300
        break
      case 'system':
        if (event.data.type === 'game_end') score += 200
        break
    }

    return score
  }

  // Settings Management
  updateSettings(newSettings: Partial<SpectatorSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.socket.emit('spectator:settings', this.settings)
  }

  getSettings(): SpectatorSettings {
    return { ...this.settings }
  }

  // Utility Functions
  getSpectators(): SpectatorPlayer[] {
    return Array.from(this.spectators.values())
  }

  getEventCount(): number {
    return this.eventBuffer.length
  }

  getHighlightCount(): number {
    return this.highlightEvents.length
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  dispose(): void {
    this.leaveSpectateRoom()
    if (this.socket) {
      this.socket.off('spectator:join')
      this.socket.off('spectator:leave')
      this.socket.off('game:event')
      this.socket.off('spectator:highlight')
      this.socket.off('replay:available')
    }
  }
}

// Replay Player
export class ReplayPlayer {
  private replay: GameReplay | null = null
  private isPlaying = false
  private currentTime = 0
  private playbackSpeed = 1.0
  private maxTime = 0
  private eventIndex = 0
  private loop = false
  private onUpdateCallback?: (state: ReplayState) => void
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.setupPlaybackLoop()
  }

  // Replay Management
  loadReplay(replay: GameReplay): void {
    this.stop()
    this.replay = replay
    this.maxTime = replay.duration
    this.currentTime = 0
    this.eventIndex = 0
  }

  // Playback Controls
  play(): void {
    if (!this.replay || this.currentTime >= this.maxTime) {
      this.currentTime = 0
      this.eventIndex = 0
    }

    this.isPlaying = true
    this.startPlaybackLoop()
  }

  pause(): void {
    this.isPlaying = false
    this.stopPlaybackLoop()
  }

  stop(): void {
    this.isPlaying = false
    this.currentTime = 0
    this.eventIndex = 0
    this.stopPlaybackLoop()
  }

  seek(time: number): void {
    if (!this.replay) return

    this.currentTime = Math.max(0, Math.min(time, this.maxTime))
    this.updateEventIndex()
    this.notifyUpdate()
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4.0, speed))
  }

  setLoop(enabled: boolean): void {
    this.loop = enabled
  }

  // Event Processing
  private processEvents(): void {
    if (!this.replay) return

    while (this.eventIndex < this.replay.events.length &&
           this.replay.events[this.eventIndex].timestamp <= this.currentTime) {
      const event = this.replay.events[this.eventIndex]
      this.processEvent(event)
      this.eventIndex++
    }
  }

  private processEvent(event: GameEvent): void {
    // Process event based on type
    switch (event.type) {
      case 'move':
        this.processMoveEvent(event)
        break
      case 'score':
        this.processScoreEvent(event)
        break
      case 'action':
        this.processActionEvent(event)
        break
      case 'system':
        this.processSystemEvent(event)
        break
      default:
        console.log('Unknown event type:', event.type)
    }
  }

  private processMoveEvent(event: GameEvent): void {
    // Handle move-specific logic
    this.notifyUpdate({ type: 'move', event })
  }

  private processScoreEvent(event: GameEvent): void {
    // Handle score-specific logic
    this.notifyUpdate({ type: 'score', event })
  }

  private processActionEvent(event: GameEvent): void {
    // Handle action-specific logic
    this.notifyUpdate({ type: 'action', event })
  }

  private processSystemEvent(event: GameEvent): void {
    // Handle system-specific logic
    this.notifyUpdate({ type: 'system', event })
  }

  // Playback Loop
  private setupPlaybackLoop(): void {
    // Setup is done in startPlaybackLoop
  }

  private startPlaybackLoop(): void {
    this.stopPlaybackLoop()

    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return

      this.currentTime += 16 * this.playbackSpeed // 60 FPS

      if (this.currentTime >= this.maxTime) {
        if (this.loop) {
          this.currentTime = 0
          this.eventIndex = 0
        } else {
          this.pause()
        }
      }

      this.processEvents()
      this.notifyUpdate()
    }, 16)
  }

  private stopPlaybackLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private updateEventIndex(): void {
    if (!this.replay) return

    // Find the appropriate event index for the current time
    this.eventIndex = 0
    while (this.eventIndex < this.replay.events.length &&
           this.replay.events[this.eventIndex].timestamp <= this.currentTime) {
      this.eventIndex++
    }
  }

  // State Management
  private notifyUpdate(extra?: any): void {
    if (!this.onUpdateCallback) return

    const state: ReplayState = {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      maxTime: this.maxTime,
      playbackSpeed: this.playbackSpeed,
      currentEvent: this.eventIndex > 0 && this.replay ? this.replay.events[this.eventIndex - 1] : null,
      progress: this.maxTime > 0 ? (this.currentTime / this.maxTime) * 100 : 0,
      ...extra
    }

    this.onUpdateCallback(state)
  }

  // Getters
  getState(): ReplayState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      maxTime: this.maxTime,
      playbackSpeed: this.playbackSpeed,
      currentEvent: this.eventIndex > 0 && this.replay ? this.replay.events[this.eventIndex - 1] : null,
      progress: this.maxTime > 0 ? (this.currentTime / this.maxTime) * 100 : 0,
      loop: this.loop
    }
  }

  getReplay(): GameReplay | null {
    return this.replay
  }

  getCurrentEvent(): GameEvent | null {
    return this.eventIndex > 0 && this.replay ? this.replay.events[this.eventIndex - 1] : null
  }

  isReplayLoaded(): boolean {
    return this.replay !== null
  }

  // Callbacks
  onUpdate(callback: (state: ReplayState) => void): void {
    this.onUpdateCallback = callback
  }

  dispose(): void {
    this.stop()
    this.stopPlaybackLoop()
    this.replay = null
    this.onUpdateCallback = undefined
  }
}

// React Hook for Spectator Mode
export function useSpectatorMode(socket: any, gameId: string, settings?: Partial<SpectatorSettings>) {
  const [spectatorManager] = useState(() => new SpectatorModeManager(socket, settings))
  const [isSpectating, setIsSpectating] = useState(false)
  const [spectators, setSpectators] = useState<SpectatorPlayer[]>([])
  const [highlights, setHighlights] = useState<GameEvent[]>([])

  const startSpectating = useCallback(async (roomId: string) => {
    const success = await spectatorManager.joinSpectateRoom(roomId, gameId)
    setIsSpectating(success)
    return success
  }, [spectatorManager, gameId])

  const stopSpectating = useCallback(() => {
    spectatorManager.leaveSpectateRoom()
    setIsSpectating(false)
  }, [spectatorManager])

  const updateSettings = useCallback((newSettings: Partial<SpectatorSettings>) => {
    spectatorManager.updateSettings(newSettings)
  }, [spectatorManager])

  // Update spectators list
  useEffect(() => {
    const interval = setInterval(() => {
      setSpectators(spectatorManager.getSpectators())
      setHighlights(spectatorManager.generateHighlights(spectatorManager['eventBuffer'] || []))
    }, 1000)

    return () => clearInterval(interval)
  }, [spectatorManager])

  return {
    isSpectating,
    spectators,
    highlights,
    startSpectating,
    stopSpectating,
    updateSettings,
    getSettings: () => spectatorManager.getSettings(),
    getCameraAngles: (gameType: string) => spectatorManager.getCameraAngles(gameType),
    isRecording: () => spectatorManager.isCurrentlyRecording(),
    dispose: () => spectatorManager.dispose()
  }
}

// React Hook for Replay System
export function useReplaySystem() {
  const [replayPlayer] = useState(() => new ReplayPlayer())
  const [replayState, setReplayState] = useState<ReplayState | null>(null)

  // Setup replay player callback
  useEffect(() => {
    replayPlayer.onUpdate((state) => {
      setReplayState(state)
    })

    return () => {
      replayPlayer.dispose()
    }
  }, [replayPlayer])

  const loadReplay = useCallback((replay: GameReplay) => {
    replayPlayer.loadReplay(replay)
  }, [replayPlayer])

  const play = useCallback(() => {
    replayPlayer.play()
  }, [replayPlayer])

  const pause = useCallback(() => {
    replayPlayer.pause()
  }, [replayPlayer])

  const stop = useCallback(() => {
    replayPlayer.stop()
  }, [replayPlayer])

  const seek = useCallback((time: number) => {
    replayPlayer.seek(time)
  }, [replayPlayer])

  const setSpeed = useCallback((speed: number) => {
    replayPlayer.setPlaybackSpeed(speed)
  }, [replayPlayer])

  const toggleLoop = useCallback(() => {
    const currentState = replayPlayer.getState()
    replayPlayer.setLoop(!currentState?.loop)
  }, [replayPlayer])

  return {
    replayState,
    loadReplay,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    toggleLoop,
    isReplayLoaded: () => replayPlayer.isReplayLoaded(),
    getReplay: () => replayPlayer.getReplay(),
    dispose: () => replayPlayer.dispose()
  }
}

// Type Definitions
export interface ReplayState {
  isPlaying: boolean
  currentTime: number
  maxTime: number
  playbackSpeed: number
  currentEvent: GameEvent | null
  progress: number
  loop: boolean
  type?: string
  event?: GameEvent
}

// Export utility functions
export const ReplayUtils = {
  formatTime: (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },

  formatDuration: (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  },

  getHighlightIcon: (eventType: string): string => {
    switch (eventType) {
      case 'score': return '⭐'
      case 'action': return '⚡'
      case 'move': return '🎯'
      case 'system': return '📢'
      default: return '🎮'
    }
  },

  getEventColor: (eventType: string): string => {
    switch (eventType) {
      case 'score': return 'text-yellow-400'
      case 'action': return 'text-orange-400'
      case 'move': return 'text-blue-400'
      case 'system': return 'text-gray-400'
      default: return 'text-white'
    }
  }
}