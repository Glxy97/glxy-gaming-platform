// @ts-nocheck
/**
 * GLXY Gaming Platform - Game State Management
 * Centralized game state management for all games
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Base game types
export type GameType = 'TETRIS' | 'CONNECT4' | 'TICTACTOE'
export type GameMode = 'single' | 'ai' | 'local' | 'online'
export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished'

// Base game state interface
export interface BaseGameState {
  id: string
  type: GameType
  mode: GameMode
  status: GameStatus
  startTime: number
  endTime?: number
  score: number
  metadata: Record<string, any>
}

// Player information
export interface Player {
  id: string
  name: string
  avatar?: string
  isAI?: boolean
  difficulty?: 'easy' | 'medium' | 'hard'
}

// Game room for multiplayer
export interface GameRoom {
  id: string
  name: string
  gameType: GameType
  host: Player
  players: Player[]
  maxPlayers: number
  isPublic: boolean
  settings: Record<string, any>
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
}

// Game session state
export interface GameSession {
  currentGame?: BaseGameState
  players: Player[]
  room?: GameRoom
  isOnline: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
}

// Game statistics
export interface GameStats {
  gameType: GameType
  totalGames: number
  wins: number
  losses: number
  draws: number
  bestScore: number
  totalScore: number
  totalPlayTime: number
  winRate: number
  lastPlayed?: number
}

// User profile for gaming
export interface GamingProfile {
  userId: string
  username: string
  level: number
  totalXP: number
  coins: number
  stats: Record<GameType, GameStats>
  achievements: string[]
  preferences: {
    soundEnabled: boolean
    musicEnabled: boolean
    vibrationEnabled: boolean
    difficulty: 'easy' | 'medium' | 'hard'
    theme: string
  }
}

// Store interface
interface GameStore {
  // Session state
  session: GameSession
  profile?: GamingProfile

  // Actions
  startGame: (gameType: GameType, mode: GameMode, players?: Player[]) => string
  endGame: (result: 'win' | 'loss' | 'draw', finalScore?: number) => void
  pauseGame: () => void
  resumeGame: () => void
  updateGameScore: (score: number) => void
  updateGameMetadata: (metadata: Partial<BaseGameState['metadata']>) => void

  // Player management
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void

  // Room management
  createRoom: (gameType: GameType, settings?: Record<string, any>) => GameRoom
  joinRoom: (roomId: string, player: Player) => boolean
  leaveRoom: () => void
  updateRoomSettings: (settings: Record<string, any>) => void

  // Profile management
  setProfile: (profile: GamingProfile) => void
  updateStats: (gameType: GameType, result: 'win' | 'loss' | 'draw', score: number, playTime: number) => void
  addAchievement: (achievementId: string) => void
  updatePreferences: (preferences: Partial<GamingProfile['preferences']>) => void

  // Connection management
  setConnectionStatus: (status: GameSession['connectionStatus']) => void
  setOnlineStatus: (isOnline: boolean) => void

  // Utility functions
  getGameDuration: () => number
  isGameActive: () => boolean
  canPause: () => boolean
  exportGameData: () => BaseGameState | null
  reset: () => void
}

// Default values
const defaultGameSession: GameSession = {
  players: [],
  isOnline: false,
  connectionStatus: 'disconnected'
}

const defaultGameStats = (gameType: GameType): GameStats => ({
  gameType,
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  bestScore: 0,
  totalScore: 0,
  totalPlayTime: 0,
  winRate: 0
})

// Zustand store
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      session: defaultGameSession,
      profile: undefined,

      startGame: (gameType: GameType, mode: GameMode, players = []) => {
        const gameId = `${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const newGame: BaseGameState = {
          id: gameId,
          type: gameType,
          mode,
          status: 'playing',
          startTime: Date.now(),
          score: 0,
          metadata: {}
        }

        set((state) => ({
          session: {
            ...state.session,
            currentGame: newGame,
            players: players.length > 0 ? players : state.session.players
          }
        }))

        return gameId
      },

      endGame: (result: 'win' | 'loss' | 'draw', finalScore = 0) => {
        const { session, profile } = get()
        const game = session.currentGame

        if (!game) return

        const endTime = Date.now()
        const playTime = endTime - game.startTime

        // Update game state
        const finishedGame: BaseGameState = {
          ...game,
          status: 'finished',
          endTime,
          score: finalScore,
          metadata: {
            ...game.metadata,
            result,
            playTime
          }
        }

        // Update statistics if profile exists
        if (profile) {
          get().updateStats(game.type, result, finalScore, playTime)
        }

        set((state) => ({
          session: {
            ...state.session,
            currentGame: finishedGame
          }
        }))

        // Auto-save game result to API if online
        if (session.isOnline && profile) {
          saveGameResult(finishedGame).catch(console.error)
        }
      },

      pauseGame: () => {
        set((state) => ({
          session: {
            ...state.session,
            currentGame: state.session.currentGame
              ? { ...state.session.currentGame, status: 'paused' }
              : undefined
          }
        }))
      },

      resumeGame: () => {
        set((state) => ({
          session: {
            ...state.session,
            currentGame: state.session.currentGame
              ? { ...state.session.currentGame, status: 'playing' }
              : undefined
          }
        }))
      },

      updateGameScore: (score: number) => {
        set((state) => ({
          session: {
            ...state.session,
            currentGame: state.session.currentGame
              ? { ...state.session.currentGame, score }
              : undefined
          }
        }))
      },

      updateGameMetadata: (metadata: Partial<BaseGameState['metadata']>) => {
        set((state) => ({
          session: {
            ...state.session,
            currentGame: state.session.currentGame
              ? {
                  ...state.session.currentGame,
                  metadata: { ...state.session.currentGame.metadata, ...metadata }
                }
              : undefined
          }
        }))
      },

      setPlayers: (players: Player[]) => {
        set((state) => ({
          session: { ...state.session, players }
        }))
      },

      addPlayer: (player: Player) => {
        set((state) => ({
          session: {
            ...state.session,
            players: [...state.session.players, player]
          }
        }))
      },

      removePlayer: (playerId: string) => {
        set((state) => ({
          session: {
            ...state.session,
            players: state.session.players.filter(p => p.id !== playerId)
          }
        }))
      },

      createRoom: (gameType: GameType, settings = {}) => {
        const { profile } = get()

        if (!profile) {
          throw new Error('Profile required to create room')
        }

        const room: GameRoom = {
          id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${profile.username}'s Game`,
          gameType,
          host: {
            id: profile.userId,
            name: profile.username
          },
          players: [{
            id: profile.userId,
            name: profile.username
          }],
          maxPlayers: 2,
          isPublic: true,
          settings,
          status: 'waiting',
          createdAt: Date.now()
        }

        set((state) => ({
          session: { ...state.session, room }
        }))

        return room
      },

      joinRoom: (roomId: string, player: Player) => {
        const { session } = get()

        if (!session.room || session.room.id !== roomId) {
          return false
        }

        if (session.room.players.length >= session.room.maxPlayers) {
          return false
        }

        if (session.room.players.some(p => p.id === player.id)) {
          return false
        }

        set((state) => ({
          session: {
            ...state.session,
            room: state.session.room
              ? {
                  ...state.session.room,
                  players: [...state.session.room.players, player]
                }
              : undefined
          }
        }))

        return true
      },

      leaveRoom: () => {
        set((state) => ({
          session: { ...state.session, room: undefined }
        }))
      },

      updateRoomSettings: (settings: Record<string, any>) => {
        set((state) => ({
          session: {
            ...state.session,
            room: state.session.room
              ? { ...state.session.room, settings: { ...state.session.room.settings, ...settings } }
              : undefined
          }
        }))
      },

      setProfile: (profile: GamingProfile) => {
        set({ profile })
      },

      updateStats: (gameType: GameType, result: 'win' | 'loss' | 'draw', score: number, playTime: number) => {
        set((state) => {
          if (!state.profile) return state

          const currentStats = state.profile.stats[gameType] || defaultGameStats(gameType)

          const newStats: GameStats = {
            ...currentStats,
            totalGames: currentStats.totalGames + 1,
            wins: currentStats.wins + (result === 'win' ? 1 : 0),
            losses: currentStats.losses + (result === 'loss' ? 1 : 0),
            draws: currentStats.draws + (result === 'draw' ? 1 : 0),
            bestScore: Math.max(currentStats.bestScore, score),
            totalScore: currentStats.totalScore + score,
            totalPlayTime: currentStats.totalPlayTime + playTime,
            lastPlayed: Date.now()
          }

          newStats.winRate = newStats.totalGames > 0
            ? Math.round((newStats.wins / newStats.totalGames) * 100)
            : 0

          return {
            profile: {
              ...state.profile,
              stats: {
                ...state.profile.stats,
                [gameType]: newStats
              }
            }
          }
        })
      },

      addAchievement: (achievementId: string) => {
        set((state) => {
          if (!state.profile) return state

          if (state.profile.achievements.includes(achievementId)) {
            return state
          }

          return {
            profile: {
              ...state.profile,
              achievements: [...state.profile.achievements, achievementId]
            }
          }
        })
      },

      updatePreferences: (preferences: Partial<GamingProfile['preferences']>) => {
        set((state) => {
          if (!state.profile) return state

          return {
            profile: {
              ...state.profile,
              preferences: { ...state.profile.preferences, ...preferences }
            }
          }
        })
      },

      setConnectionStatus: (connectionStatus: GameSession['connectionStatus']) => {
        set((state) => ({
          session: { ...state.session, connectionStatus }
        }))
      },

      setOnlineStatus: (isOnline: boolean) => {
        set((state) => ({
          session: { ...state.session, isOnline }
        }))
      },

      getGameDuration: () => {
        const { session } = get()
        const game = session.currentGame

        if (!game) return 0

        const endTime = game.endTime || Date.now()
        return endTime - game.startTime
      },

      isGameActive: () => {
        const { session } = get()
        return session.currentGame?.status === 'playing'
      },

      canPause: () => {
        const { session } = get()
        const game = session.currentGame
        return game?.status === 'playing' && game.mode !== 'online'
      },

      exportGameData: () => {
        const { session } = get()
        return session.currentGame || null
      },

      reset: () => {
        set({
          session: defaultGameSession,
          profile: undefined
        })
      }
    }),
    {
      name: 'glxy-game-store',
      partialize: (state) => ({
        profile: state.profile,
        session: {
          ...state.session,
          currentGame: undefined // Don't persist active games
        }
      })
    }
  )
)

// API integration functions
async function saveGameResult(game: BaseGameState): Promise<void> {
  try {
    const endpoint = `/api/games/${game.type.toLowerCase()}`

    const payload = {
      gameMode: game.mode,
      score: game.score,
      ...game.metadata
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Failed to save game result: ${response.statusText}`)
    }

    console.log('Game result saved successfully')
  } catch (error) {
    console.error('Error saving game result:', error)
    throw error
  }
}

// Utility hooks
export const useCurrentGame = () => {
  return useGameStore((state) => state.session.currentGame)
}

export const useGameProfile = () => {
  return useGameStore((state) => state.profile)
}

export const useGameStats = (gameType?: GameType) => {
  return useGameStore((state) => {
    if (!state.profile) return undefined
    return gameType ? state.profile.stats[gameType] : state.profile.stats
  })
}

export const useGameRoom = () => {
  return useGameStore((state) => state.session.room)
}

export const useConnectionStatus = () => {
  return useGameStore((state) => ({
    isOnline: state.session.isOnline,
    connectionStatus: state.session.connectionStatus
  }))
}

// Game-specific helpers
export const createTetrisGame = (mode: GameMode = 'single') => {
  const { startGame, updateGameMetadata } = useGameStore.getState()

  const gameId = startGame('TETRIS', mode)

  updateGameMetadata({
    level: 1,
    lines: 0,
    linesPerLevel: 10
  })

  return gameId
}

export const createConnect4Game = (mode: GameMode = 'ai', difficulty = 'medium') => {
  const { startGame, updateGameMetadata, setPlayers } = useGameStore.getState()

  const players: Player[] = [
    { id: 'human', name: 'Player 1' }
  ]

  if (mode === 'ai') {
    players.push({
      id: 'ai',
      name: 'AI',
      isAI: true,
      difficulty: difficulty as 'easy' | 'medium' | 'hard'
    })
  } else if (mode === 'local') {
    players.push({ id: 'human2', name: 'Player 2' })
  }

  setPlayers(players)
  const gameId = startGame('CONNECT4', mode, players)

  updateGameMetadata({
    difficulty,
    moves: 0,
    currentPlayer: 1
  })

  return gameId
}

export default useGameStore