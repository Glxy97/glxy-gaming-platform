/**
 * GLXY Gaming Platform - Multiplayer Game Handler
 * Handles multiplayer game logic for Tetris and Connect 4
 */

import { Socket } from 'socket.io-client'
import { useState, useEffect } from 'react'
import { useGameStore, GameType, GameMode, Player } from './game-state-manager'

export interface MultiplayerGame {
  roomId: string
  gameType: GameType
  players: Player[]
  gameState: any
  status: 'waiting' | 'playing' | 'paused' | 'finished'
  currentPlayer?: string
  host: Player
}

export interface GameMove {
  playerId: string
  type: string
  data: any
  timestamp: number
}

export class MultiplayerHandler {
  private socket: Socket
  private currentRoom?: string
  protected gameStore: any

  constructor(socket: Socket) {
    this.socket = socket
    this.gameStore = useGameStore.getState()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Room events
    this.socket.on('room:joined', this.handleRoomJoined.bind(this))
    this.socket.on('room:left', this.handleRoomLeft.bind(this))
    this.socket.on('room:updated', this.handleRoomUpdated.bind(this))
    this.socket.on('room:player_ready', this.handlePlayerReady.bind(this))

    // Game events
    this.socket.on('game:started', this.handleGameStarted.bind(this))
    this.socket.on('game:state_update', this.handleGameStateUpdate.bind(this))
    this.socket.on('game:move', this.handleGameMove.bind(this))
    this.socket.on('game:ended', this.handleGameEnded.bind(this))

    // Chat events
    this.socket.on('chat:message', this.handleChatMessage.bind(this))

    // User events
    this.socket.on('user:online', this.handleUserOnline.bind(this))
    this.socket.on('user:offline', this.handleUserOffline.bind(this))

    // Error handling
    this.socket.on('error', this.handleError.bind(this))
  }

  // Room Management
  async createRoom(gameType: GameType, name?: string, settings?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const roomData = {
        name: name || `${gameType} Game`,
        gameType,
        settings: {
          maxPlayers: 2,
          isPublic: true,
          ...settings
        }
      }

      this.socket.emit('room:create', roomData)

      // Wait for room creation confirmation
      const timeout = setTimeout(() => {
        reject(new Error('Room creation timeout'))
      }, 10000)

      const handleRoomJoined = (data: any) => {
        clearTimeout(timeout)
        this.socket.off('room:joined', handleRoomJoined)
        this.currentRoom = data.roomId
        resolve(data.roomId)
      }

      this.socket.on('room:joined', handleRoomJoined)
    })
  }

  async joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('room:join', { roomId })

      const timeout = setTimeout(() => {
        reject(new Error('Room join timeout'))
      }, 10000)

      const handleRoomJoined = (data: any) => {
        if (data.roomId === roomId) {
          clearTimeout(timeout)
          this.socket.off('room:joined', handleRoomJoined)
          this.currentRoom = roomId
          resolve()
        }
      }

      const handleError = (error: any) => {
        clearTimeout(timeout)
        this.socket.off('error', handleError)
        reject(new Error(error.message || 'Failed to join room'))
      }

      this.socket.on('room:joined', handleRoomJoined)
      this.socket.on('error', handleError)
    })
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      this.socket.emit('room:leave', { roomId: this.currentRoom })
      this.currentRoom = undefined
      this.gameStore.leaveRoom()
    }
  }

  setPlayerReady(isReady: boolean): void {
    if (this.currentRoom) {
      this.socket.emit('room:ready', {
        roomId: this.currentRoom,
        isReady
      })
    }
  }

  // Game Actions
  makeMove(move: GameMove): void {
    if (this.currentRoom) {
      this.socket.emit('game:move', {
        roomId: this.currentRoom,
        move
      })
    }
  }

  forfeitGame(): void {
    if (this.currentRoom) {
      this.socket.emit('game:forfeit', {
        roomId: this.currentRoom
      })
    }
  }

  pauseGame(): void {
    if (this.currentRoom) {
      this.socket.emit('game:pause', {
        roomId: this.currentRoom
      })
    }
  }

  resumeGame(): void {
    if (this.currentRoom) {
      this.socket.emit('game:resume', {
        roomId: this.currentRoom
      })
    }
  }

  // Chat
  sendMessage(message: string): void {
    if (this.currentRoom) {
      this.socket.emit('chat:send', {
        roomId: this.currentRoom,
        message,
        type: 'room'
      })
    }
  }

  sendTyping(isTyping: boolean): void {
    if (this.currentRoom) {
      this.socket.emit('chat:typing', {
        roomId: this.currentRoom,
        isTyping
      })
    }
  }

  // Event Handlers
  private handleRoomJoined(data: any) {
    console.log('Room joined:', data)
    this.gameStore.setPlayers(data.room.players.map((p: any) => ({
      id: p.user.id,
      name: p.user.username,
      avatar: p.user.avatar
    })))
  }

  private handleRoomLeft(data: any) {
    console.log('Room left:', data)
    this.gameStore.removePlayer(data.userId)
  }

  private handleRoomUpdated(data: any) {
    console.log('Room updated:', data)
    // Update room settings or state
  }

  private handlePlayerReady(data: any) {
    console.log('Player ready:', data)
    // Update player ready status
  }

  private handleGameStarted(data: any) {
    console.log('Game started:', data)
    const { roomId, gameState } = data

    // Initialize local game based on game type
    if (gameState.gameType === 'TETRIS') {
      this.gameStore.startGame('TETRIS', 'online', gameState.players)
    } else if (gameState.gameType === 'CONNECT4') {
      this.gameStore.startGame('CONNECT4', 'online', gameState.players)
    }

    // Update game metadata with multiplayer data
    this.gameStore.updateGameMetadata({
      roomId,
      multiplayerState: gameState,
      isMultiplayer: true
    })
  }

  private handleGameStateUpdate(data: any) {
    console.log('Game state update:', data)
    const { gameState } = data

    // Update local game state with remote changes
    this.gameStore.updateGameMetadata({
      multiplayerState: gameState,
      lastSync: Date.now()
    })
  }

  private handleGameMove(data: any) {
    console.log('Game move:', data)
    const { roomId, move } = data

    // Process opponent's move
    this.gameStore.updateGameMetadata({
      lastOpponentMove: move,
      lastMoveTime: Date.now()
    })
  }

  private handleGameEnded(data: any) {
    console.log('Game ended:', data)
    const { winner, reason, stats } = data

    // Determine result from player's perspective
    const currentUser = this.gameStore.profile?.userId
    let result: 'win' | 'loss' | 'draw' = 'draw'

    if (winner && currentUser) {
      result = winner === currentUser ? 'win' : 'loss'
    }

    // End the game with final score
    this.gameStore.endGame(result, stats?.finalScore || 0)
  }

  private handleChatMessage(data: any) {
    console.log('Chat message:', data)
    // Handle chat message display
  }

  private handleUserOnline(data: any) {
    console.log('User online:', data)
    // Update online status
  }

  private handleUserOffline(data: any) {
    console.log('User offline:', data)
    // Update offline status
  }

  private handleError(error: any) {
    console.error('Socket error:', error)
    // Handle error display
  }

  // Utility Methods
  getCurrentRoom(): string | undefined {
    return this.currentRoom
  }

  isInRoom(): boolean {
    return !!this.currentRoom
  }

  disconnect(): void {
    this.socket.disconnect()
  }
}

// Tetris-specific multiplayer logic
export class TetrisMultiplayer extends MultiplayerHandler {
  sendPieceMove(position: { x: number; y: number }, piece: any): void {
    const move: GameMove = {
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'piece_move',
      data: { position, piece },
      timestamp: Date.now()
    }
    this.makeMove(move)
  }

  sendLineCleared(lines: number[]): void {
    const move: GameMove = {
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'lines_cleared',
      data: { lines, count: lines.length },
      timestamp: Date.now()
    }
    this.makeMove(move)
  }

  sendAttackLines(count: number): void {
    const move: GameMove = {
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'attack_lines',
      data: { count },
      timestamp: Date.now()
    }
    this.makeMove(move)
  }
}

// Connect 4-specific multiplayer logic
export class Connect4Multiplayer extends MultiplayerHandler {
  sendColumnDrop(column: number): void {
    const move: GameMove = {
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'column_drop',
      data: { column },
      timestamp: Date.now()
    }
    this.makeMove(move)
  }

  sendGameWin(winningPositions: number[][]): void {
    const move: GameMove = {
      playerId: this.gameStore.profile?.userId || 'unknown',
      type: 'game_win',
      data: { winningPositions },
      timestamp: Date.now()
    }
    this.makeMove(move)
  }
}

// Factory function to create appropriate multiplayer handler
export function createMultiplayerHandler(socket: Socket, gameType: GameType): MultiplayerHandler {
  switch (gameType) {
    case 'TETRIS':
      return new TetrisMultiplayer(socket)
    case 'CONNECT4':
      return new Connect4Multiplayer(socket)
    default:
      return new MultiplayerHandler(socket)
  }
}

// React hook for multiplayer functionality
export function useMultiplayer(gameType: GameType) {
  const [handler, setHandler] = useState<MultiplayerHandler | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<string | undefined>()

  useEffect(() => {
    // Import socket dynamically to avoid SSR issues
    import('./socket-client').then(({ getClientSocket }) => {
      const socket = getClientSocket()
      const multiplayerHandler = createMultiplayerHandler(socket, gameType)

      setHandler(multiplayerHandler)
      setIsConnected(socket.connected)

      const handleConnect = () => setIsConnected(true)
      const handleDisconnect = () => setIsConnected(false)

      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)

      return () => {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
      }
    })
  }, [gameType])

  useEffect(() => {
    if (handler) {
      setCurrentRoom(handler.getCurrentRoom())
    }
  }, [handler])

  return {
    handler,
    isConnected,
    currentRoom,
    isInRoom: !!currentRoom
  }
}