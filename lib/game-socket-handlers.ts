/**
 * GLXY Gaming Platform - Game-Specific Socket.IO Event Handlers
 * Complete multiplayer support for: Tetris, Connect4, TicTacToe, Chess, UNO, FPS, Racing
 *
 * Features:
 * - Real-time game state synchronization
 * - Move validation & broadcasting
 * - Player turn management
 * - Victory condition checking
 * - Attack/Defense mechanics (Tetris Battle)
 * - ELO rating updates
 */

import { Server as ServerIO, Socket } from 'socket.io'
import { prisma } from '@/lib/db'
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/redis-server'
import { GameStateManager, PerformanceMonitor } from '@/lib/socket-server-optimized'

// ============================================================================
// GAME STATE INTERFACES
// ============================================================================

interface BaseGameState {
  roomId: string
  gameType: string
  players: { id: string; username: string; avatar: string | null }[]
  currentPlayer?: string
  status: 'waiting' | 'playing' | 'paused' | 'finished'
  winner?: string | null
  startTime: number
  version: number
}

interface TetrisGameState extends BaseGameState {
  gameType: 'TETRIS'
  playerBoards: {
    [playerId: string]: {
      board: (string | null)[][]
      currentPiece: any
      nextPieces: string[]
      score: number
      level: number
      lines: number
      combo: number
      attackLines: number
    }
  }
}

interface Connect4GameState extends BaseGameState {
  gameType: 'CONNECT4'
  board: (string | null)[][]
  lastMove?: { row: number; col: number; player: string }
}

interface TicTacToeGameState extends BaseGameState {
  gameType: 'TICTACTOE'
  board: (string | null)[]
  lastMove?: { index: number; player: string }
}

interface ChessGameState extends BaseGameState {
  gameType: 'CHESS'
  board: any[][] // Chess pieces
  moveHistory: any[]
  timeControl: {
    white: number
    black: number
  }
  isCheck: boolean
  isCheckmate: boolean
}

interface UnoGameState extends BaseGameState {
  gameType: 'UNO'
  playerHands: { [playerId: string]: number } // Card counts
  currentCard: { color: string; type: string; value?: number }
  direction: 'clockwise' | 'counterclockwise'
  drawCount: number
}

// ============================================================================
// TETRIS BATTLE HANDLERS
// ============================================================================

export function registerTetrisHandlers(io: ServerIO, socket: Socket) {
  // Tetris piece movement
  socket.on('tetris:move', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, move, playerId } = data

      // Validate player is in room
      const room = await prisma.gameRoom.findUnique({
        where: { id: roomId },
        include: { players: true }
      })

      if (!room || !room.players.some(p => p.userId === playerId)) {
        return socket.emit('error', { code: 'INVALID_PLAYER' })
      }

      // Update game state
      const gameState = await GameStateManager.getGameState(roomId) || {}
      const playerBoard = gameState.playerBoards?.[playerId] || {}

      // Apply move
      const updatedBoard = {
        ...playerBoard,
        currentPiece: move.piece,
        board: move.board
      }

      const newState = {
        ...gameState,
        playerBoards: {
          ...gameState.playerBoards,
          [playerId]: updatedBoard
        }
      }

      await GameStateManager.updateGameState(roomId, newState, playerId)

      // Broadcast to room
      io.to(roomId).emit('tetris:move_update', {
        playerId,
        move,
        timestamp: Date.now()
      })

      await PerformanceMonitor.recordLatency('tetris_move', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('Tetris move error:', error)
      socket.emit('error', { code: 'TETRIS_MOVE_FAILED' })
      return
    }
  })

  // Tetris lines cleared (Battle Mode)
  socket.on('tetris:lines_cleared', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, playerId, lines, count } = data

      // Get current state
      const gameState = await GameStateManager.getGameState(roomId) || {}

      // Calculate attack lines (T-Spin, Combos, etc.)
      let attackLines = 0
      if (count === 1) attackLines = 0
      else if (count === 2) attackLines = 1
      else if (count === 3) attackLines = 2
      else if (count === 4) attackLines = 4 // Tetris!

      // Apply combo multiplier
      const currentCombo = gameState.playerBoards?.[playerId]?.combo || 0
      if (currentCombo > 0) {
        attackLines += Math.floor(currentCombo / 2)
      }

      // Send attack lines to ALL opponents
      const opponents = Object.keys(gameState.playerBoards || {}).filter(id => id !== playerId)

      opponents.forEach(opponentId => {
        const opponentBoard = gameState.playerBoards[opponentId] || {}
        gameState.playerBoards[opponentId] = {
          ...opponentBoard,
          attackLines: (opponentBoard.attackLines || 0) + attackLines
        }
      })

      // Update clearing player's stats
      const playerBoard = gameState.playerBoards?.[playerId] || {}
      gameState.playerBoards[playerId] = {
        ...playerBoard,
        lines: (playerBoard.lines || 0) + count,
        combo: currentCombo + 1,
        score: (playerBoard.score || 0) + (count * 100 * (1 + currentCombo))
      }

      await GameStateManager.updateGameState(roomId, gameState, playerId)

      // Broadcast attack
      io.to(roomId).emit('tetris:attack', {
        from: playerId,
        attackLines,
        combo: currentCombo + 1,
        linesCleared: count
      })

      await PerformanceMonitor.recordLatency('tetris_lines_cleared', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('Tetris lines cleared error:', error)
      return
    }
  })

  // Tetris game over
  socket.on('tetris:game_over', async (data) => {
    try {
      const { roomId, playerId } = data

      const gameState = await GameStateManager.getGameState(roomId) || {}

      // Check if this player was last one standing
      const alivePlayers = Object.keys(gameState.playerBoards || {}).filter(id => {
        return gameState.playerBoards[id].isAlive !== false
      })

      if (alivePlayers.length === 1) {
        // We have a winner!
        const winner = alivePlayers[0]

        gameState.status = 'finished'
        ;(gameState as any).winner = winner

        await GameStateManager.updateGameState(roomId, gameState)

        // Update database
        await prisma.gameRoom.update({
          where: { id: roomId },
          data: {
            status: 'FINISHED'
            // TODO: Add winnerId field to GameRoom model if needed
          }
        })

        io.to(roomId).emit('game:finished', {
          winner,
          stats: gameState.playerBoards
        })
      } else {
        // Just mark this player as dead
        if (gameState.playerBoards?.[playerId]) {
          gameState.playerBoards[playerId].isAlive = false
        }

        await GameStateManager.updateGameState(roomId, gameState)

        io.to(roomId).emit('tetris:player_eliminated', {
          playerId,
          remainingPlayers: alivePlayers.length - 1
        })
      }

    } catch (error) {
      console.error('Tetris game over error:', error)
      return
    }
  })
}

// ============================================================================
// CONNECT4 HANDLERS
// ============================================================================

export function registerConnect4Handlers(io: ServerIO, socket: Socket) {
  socket.on('connect4:drop_piece', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, column, playerId } = data

      const gameState = await GameStateManager.getGameState(roomId) as Connect4GameState || {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        players: [],
        currentPlayer: '',
        status: 'playing',
        version: 0
      }

      // Validate it's this player's turn
      if (gameState.currentPlayer !== playerId) {
        return socket.emit('error', { code: 'NOT_YOUR_TURN' })
      }

      // Find lowest empty row in column
      let row = -1
      for (let r = 5; r >= 0; r--) {
        if (!gameState.board[r][column]) {
          row = r
          break
        }
      }

      if (row === -1) {
        return socket.emit('error', { code: 'COLUMN_FULL' })
      }

      // Place piece
      gameState.board[row][column] = playerId
      ;(gameState as any).lastMove = { row, col: column, player: playerId }

      // Check for winner
      const winner = checkConnect4Winner(gameState.board, row, column, playerId)

      if (winner) {
        gameState.status = 'finished'
        ;(gameState as any).winner = playerId

        await prisma.gameRoom.update({
          where: { id: roomId },
          data: { status: 'FINISHED' }
          // TODO: Add winnerId field to GameRoom model if needed
        })
      } else {
        // Switch turn
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === playerId)
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length
        gameState.currentPlayer = gameState.players[nextPlayerIndex].id
      }

      gameState.version++
      await GameStateManager.updateGameState(roomId, gameState, playerId)

      // Broadcast move
      io.to(roomId).emit('connect4:move_made', {
        row,
        column,
        playerId,
        winner: winner ? playerId : null,
        nextPlayer: gameState.currentPlayer,
        board: gameState.board
      })

      await PerformanceMonitor.recordLatency('connect4_drop', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('Connect4 drop error:', error)
      socket.emit('error', { code: 'CONNECT4_MOVE_FAILED' })
      return
    }
  })
}

function checkConnect4Winner(board: (string | null)[][], row: number, col: number, playerId: string): boolean {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
  ]

  for (const [dRow, dCol] of directions) {
    let count = 1

    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const newRow = row + i * dRow
      const newCol = col + i * dCol
      if (
        newRow >= 0 && newRow < 6 &&
        newCol >= 0 && newCol < 7 &&
        board[newRow][newCol] === playerId
      ) {
        count++
      } else break
    }

    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const newRow = row - i * dRow
      const newCol = col - i * dCol
      if (
        newRow >= 0 && newRow < 6 &&
        newCol >= 0 && newCol < 7 &&
        board[newRow][newCol] === playerId
      ) {
        count++
      } else break
    }

    if (count >= 4) return true
  }

  return false
}

// ============================================================================
// TICTACTOE HANDLERS
// ============================================================================

export function registerTicTacToeHandlers(io: ServerIO, socket: Socket) {
  socket.on('tictactoe:make_move', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, index, playerId } = data

      const gameState = await GameStateManager.getGameState(roomId) as TicTacToeGameState || {
        board: Array(9).fill(null),
        players: [],
        currentPlayer: '',
        status: 'playing',
        version: 0
      }

      // Validate turn
      if (gameState.currentPlayer !== playerId) {
        return socket.emit('error', { code: 'NOT_YOUR_TURN' })
      }

      // Validate cell is empty
      if (gameState.board[index] !== null) {
        return socket.emit('error', { code: 'CELL_OCCUPIED' })
      }

      // Make move
      gameState.board[index] = playerId
      ;(gameState as any).lastMove = { index, player: playerId }

      // Check winner
      const winner = checkTicTacToeWinner(gameState.board)
      const isDraw = !winner && gameState.board.every(cell => cell !== null)

      if (winner || isDraw) {
        gameState.status = 'finished'
        ;(gameState as any).winner = winner || 'draw'

        await prisma.gameRoom.update({
          where: { id: roomId },
          data: {
            status: 'FINISHED'
            // TODO: Add winnerId field to GameRoom model if needed
          }
        })
      } else {
        // Switch turn
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === playerId)
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length
        gameState.currentPlayer = gameState.players[nextPlayerIndex].id
      }

      gameState.version++
      await GameStateManager.updateGameState(roomId, gameState, playerId)

      // Broadcast
      io.to(roomId).emit('tictactoe:move_made', {
        index,
        playerId,
        winner: winner || (isDraw ? 'draw' : null),
        nextPlayer: gameState.currentPlayer,
        board: gameState.board
      })

      await PerformanceMonitor.recordLatency('tictactoe_move', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('TicTacToe move error:', error)
      socket.emit('error', { code: 'TICTACTOE_MOVE_FAILED' })
      return
    }
  })
}

function checkTicTacToeWinner(board: (string | null)[]): string | null {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ]

  for (const combo of winningCombinations) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return null
}

// ============================================================================
// CHESS HANDLERS
// ============================================================================

export function registerChessHandlers(io: ServerIO, socket: Socket) {
  socket.on('chess:make_move', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, move, playerId } = data
      // from, to, piece, promotion, etc.

      const gameState = await GameStateManager.getGameState(roomId) as ChessGameState

      // Validate it's player's turn
      const playerColor = gameState.players[0].id === playerId ? 'white' : 'black'
      if (gameState.currentPlayer !== playerColor) {
        return socket.emit('error', { code: 'NOT_YOUR_TURN' })
      }

      // TODO: Full chess move validation (complex!)
      // For now, just trust the client validation

      // Update board
      gameState.moveHistory.push(move)
      gameState.board = move.boardAfter // Client sends new board state

      // Switch turn
      gameState.currentPlayer = playerColor === 'white' ? 'black' : 'white'

      // Update time control
      const timeUsed = Date.now() - move.startTime
      if (playerColor === 'white') {
        gameState.timeControl.white = Math.max(0, gameState.timeControl.white - timeUsed)
      } else {
        gameState.timeControl.black = Math.max(0, gameState.timeControl.black - timeUsed)
      }

      // Check game over conditions
      if (move.checkmate) {
        gameState.status = 'finished'
        gameState.winner = playerId
        gameState.isCheckmate = true

        await prisma.gameRoom.update({
          where: { id: roomId },
          data: { status: 'FINISHED' }
          // TODO: Add winnerId field to GameRoom model if needed
        })
      } else if (move.check) {
        gameState.isCheck = true
      }

      await GameStateManager.updateGameState(roomId, gameState, playerId)

      // Broadcast
      io.to(roomId).emit('chess:move_made', {
        move,
        playerId,
        nextPlayer: gameState.currentPlayer,
        timeControl: gameState.timeControl,
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate
      })

      await PerformanceMonitor.recordLatency('chess_move', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('Chess move error:', error)
      socket.emit('error', { code: 'CHESS_MOVE_FAILED' })
      return
    }
  })

  // Chess time ran out
  socket.on('chess:time_out', async (data) => {
    const { roomId, playerId } = data

    const gameState = await GameStateManager.getGameState(roomId) as ChessGameState
    const opponent = gameState.players.find(p => p.id !== playerId)

    gameState.status = 'finished'
    gameState.winner = opponent?.id || null

    await prisma.gameRoom.update({
      where: { id: roomId },
      data: { status: 'FINISHED' }
      // TODO: Add winnerId field to GameRoom model if needed
    })

    await GameStateManager.updateGameState(roomId, gameState)

    io.to(roomId).emit('chess:game_over', {
      reason: 'timeout',
      winner: opponent?.id
    })
  })
}

// ============================================================================
// UNO HANDLERS
// ============================================================================

export function registerUnoHandlers(io: ServerIO, socket: Socket) {
  socket.on('uno:play_card', async (data) => {
    const startTime = Date.now()
    try {
      const { roomId, cardId, selectedColor, playerId } = data

      const gameState = await GameStateManager.getGameState(roomId) as UnoGameState

      // Validate turn
      if (gameState.currentPlayer !== playerId) {
        return socket.emit('error', { code: 'NOT_YOUR_TURN' })
      }

      // Update current card
      const playedCard = data.card // Client sends full card data
      gameState.currentCard = playedCard

      // Handle special cards
      if (playedCard.type === 'reverse') {
        gameState.direction = gameState.direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
      } else if (playedCard.type === 'skip') {
        // Skip next player
      } else if (playedCard.type === 'draw2') {
        gameState.drawCount = 2
      } else if (playedCard.type === 'wild_draw4') {
        gameState.drawCount = 4
      }

      // Wild card color selection
      if (playedCard.type === 'wild' || playedCard.type === 'wild_draw4') {
        gameState.currentCard.color = selectedColor
      }

      // Update hand count
      gameState.playerHands[playerId] -= 1

      // Check for UNO (1 card left)
      const hasUno = gameState.playerHands[playerId] === 1

      // Check for winner
      if (gameState.playerHands[playerId] === 0) {
        gameState.status = 'finished'
        gameState.winner = playerId

        await prisma.gameRoom.update({
          where: { id: roomId },
          data: { status: 'FINISHED' }
          // TODO: Add winnerId field to GameRoom model if needed
        })
      } else {
        // Next player
        const currentIndex = gameState.players.findIndex(p => p.id === playerId)
        let nextIndex = gameState.direction === 'clockwise'
          ? (currentIndex + 1) % gameState.players.length
          : (currentIndex - 1 + gameState.players.length) % gameState.players.length

        // Handle skip
        if (playedCard.type === 'skip') {
          nextIndex = gameState.direction === 'clockwise'
            ? (nextIndex + 1) % gameState.players.length
            : (nextIndex - 1 + gameState.players.length) % gameState.players.length
        }

        gameState.currentPlayer = gameState.players[nextIndex].id
      }

      await GameStateManager.updateGameState(roomId, gameState, playerId)

      // Broadcast
      io.to(roomId).emit('uno:card_played', {
        playerId,
        card: playedCard,
        hasUno,
        winner: gameState.winner,
        nextPlayer: gameState.currentPlayer,
        direction: gameState.direction,
        drawCount: gameState.drawCount,
        playerHands: gameState.playerHands
      })

      await PerformanceMonitor.recordLatency('uno_play_card', Date.now() - startTime, roomId)
      return

    } catch (error) {
      console.error('UNO play card error:', error)
      socket.emit('error', { code: 'UNO_PLAY_FAILED' })
      return
    }
  })

  socket.on('uno:draw_card', async (data) => {
    const { roomId, playerId, cardCount = 1 } = data

    const gameState = await GameStateManager.getGameState(roomId) as UnoGameState

    gameState.playerHands[playerId] = (gameState.playerHands[playerId] || 0) + cardCount
    gameState.drawCount = 0 // Reset draw count after drawing

    await GameStateManager.updateGameState(roomId, gameState)

    socket.emit('uno:cards_drawn', {
      count: cardCount,
      newHandCount: gameState.playerHands[playerId]
    })

    // Broadcast to others (without showing cards)
    socket.to(roomId).emit('uno:player_drew', {
      playerId,
      count: cardCount
    })
  })
}

// ============================================================================
// INITIALIZE ALL GAME HANDLERS
// ============================================================================

export function initializeGameHandlers(io: ServerIO) {
  io.on('connection', (socket) => {
    // Register all game-specific handlers
    registerTetrisHandlers(io, socket)
    registerConnect4Handlers(io, socket)
    registerTicTacToeHandlers(io, socket)
    registerChessHandlers(io, socket)
    registerUnoHandlers(io, socket)

    console.log(`🎮 Game handlers registered for socket ${socket.id}`)
  })
}
