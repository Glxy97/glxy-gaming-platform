// @ts-nocheck

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Socket } from 'socket.io-client'
import { GamingCard } from '@/components/ui/gaming-card'
import { GamingButton } from '@/components/ui/gaming-button'
import { RotateCcw, Flag, PauseCircle, Play } from 'lucide-react'

interface ChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
  color: 'white' | 'black'
  position: string
  hasMoved?: boolean
}

interface ChessBoardProps {
  gameMode: 'computer' | 'online' | 'random'
  roomId?: string | null
  socket?: Socket | null
}

export function ChessBoard({ gameMode, roomId, socket }: ChessBoardProps) {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard())
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white')
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'ended'>('playing')
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [gameTime, setGameTime] = useState({ white: 900, black: 900 }) // 15 minutes each
  const [isPaused, setIsPaused] = useState(false)

  // Initialize chess board with pieces
  function initializeBoard(): (ChessPiece | null)[][] {
    const board = Array(8).fill(null).map(() => Array(8).fill(null))
    
    // Place black pieces
    const blackPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as const
    blackPieces.forEach((piece, i) => {
      board[0][i] = { type: piece, color: 'black', position: String.fromCharCode(97 + i) + '8' }
    })
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black', position: String.fromCharCode(97 + i) + '7' }
    }

    // Place white pieces
    const whitePieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as const
    whitePieces.forEach((piece, i) => {
      board[7][i] = { type: piece, color: 'white', position: String.fromCharCode(97 + i) + '1' }
    })
    for (let i = 0; i < 8; i++) {
      board[6][i] = { type: 'pawn', color: 'white', position: String.fromCharCode(97 + i) + '2' }
    }

    return board
  }

  // Get piece unicode symbol
  const getPieceSymbol = (piece: ChessPiece): string => {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    }
    return symbols[piece.color][piece.type]
  }

  // Check if move is valid (simplified validation)
  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol]
    if (!piece || piece.color !== currentPlayer) return false
    
    // Basic validation - in a real game, you'd implement proper chess rules
    const rowDiff = Math.abs(toRow - fromRow)
    const colDiff = Math.abs(toCol - fromCol)
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1
        const startRow = piece.color === 'white' ? 6 : 1
        
        if (colDiff === 0) {
          // Moving forward
          if (toRow === fromRow + direction && !board[toRow][toCol]) return true
          if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[toRow][toCol]) return true
        } else if (colDiff === 1 && toRow === fromRow + direction) {
          // Capturing diagonally
          return board[toRow][toCol] !== null && board[toRow][toCol]?.color !== piece.color
        }
        return false
        
      case 'rook':
        return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(fromRow, fromCol, toRow, toCol)
        
      case 'bishop':
        return rowDiff === colDiff && !isPathBlocked(fromRow, fromCol, toRow, toCol)
        
      case 'queen':
        return (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) && !isPathBlocked(fromRow, fromCol, toRow, toCol)
        
      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
        
      case 'king':
        return rowDiff <= 1 && colDiff <= 1
        
      default:
        return false
    }
  }

  // Check if path is blocked (simplified)
  const isPathBlocked = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0
    
    let currentRow = fromRow + rowStep
    let currentCol = fromCol + colStep
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return true
      currentRow += rowStep
      currentCol += colStep
    }
    
    return false
  }

  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== 'playing' || isPaused) return

    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare
      
      if (selectedRow === row && selectedCol === col) {
        // Deselect
        setSelectedSquare(null)
      } else if (isValidMove(selectedRow, selectedCol, row, col)) {
        // Make move
        const newBoard = [...board]
        const piece = newBoard[selectedRow][selectedCol]
        const targetPiece = newBoard[row][col]
        
        // Move piece
        newBoard[row][col] = piece
        newBoard[selectedRow][selectedCol] = null
        
        // Update position
        if (piece) {
          piece.position = String.fromCharCode(97 + col) + (8 - row)
          piece.hasMoved = true
        }
        
        setBoard(newBoard)
        setSelectedSquare(null)
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white')
        
        // Add to move history
        const moveNotation = `${piece?.type}${String.fromCharCode(97 + col)}${8 - row}`
        setMoveHistory(prev => [...prev, moveNotation])
        
        // Emit move via socket for online games
        if (socket && roomId && (gameMode === 'online' || gameMode === 'random')) {
          socket.emit('game:move', {
            roomId,
            move: { from: [selectedRow, selectedCol], to: [row, col] },
            gameState: newBoard
          })
        }
        
      } else {
        // Select new piece
        const piece = board[row][col]
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare([row, col])
        }
      }
    } else {
      // Select piece
      const piece = board[row][col]
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare([row, col])
      }
    }
  }

  // Game controls
  const handlePauseResume = () => {
    setIsPaused(!isPaused)
    setGameStatus(gameStatus === 'playing' ? 'paused' : 'playing')
  }

  const handleResign = () => {
    setGameStatus('ended')
    setWinner(currentPlayer === 'white' ? 'black' : 'white')
  }

  const handleRestart = () => {
    setBoard(initializeBoard())
    setSelectedSquare(null)
    setCurrentPlayer('white')
    setGameStatus('playing')
    setWinner(null)
    setMoveHistory([])
    setGameTime({ white: 900, black: 900 })
    setIsPaused(false)
  }

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused) return

    const interval = setInterval(() => {
      setGameTime(prev => {
        const newTime = { ...prev }
        if (currentPlayer === 'white') {
          newTime.white = Math.max(0, newTime.white - 1)
          if (newTime.white === 0) {
            setGameStatus('ended')
            setWinner('black')
          }
        } else {
          newTime.black = Math.max(0, newTime.black - 1)
          if (newTime.black === 0) {
            setGameStatus('ended')
            setWinner('white')
          }
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentPlayer, gameStatus, isPaused])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Weiß</div>
            <div className={`text-lg font-mono font-bold ${currentPlayer === 'white' ? 'text-gaming-primary' : 'text-foreground'}`}>
              {formatTime(gameTime.white)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Schwarz</div>
            <div className={`text-lg font-mono font-bold ${currentPlayer === 'black' ? 'text-gaming-primary' : 'text-foreground'}`}>
              {formatTime(gameTime.black)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GamingButton
            variant="secondary"
            size="sm"
            onClick={handlePauseResume}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            {isPaused ? 'Fortsetzen' : 'Pause'}
          </GamingButton>
          <GamingButton
            variant="outline"
            size="sm"
            onClick={handleRestart}
          >
            <RotateCcw className="w-4 h-4" />
          </GamingButton>
          <GamingButton
            variant="secondary"
            size="sm"
            onClick={handleResign}
          >
            <Flag className="w-4 h-4" />
            Aufgeben
          </GamingButton>
        </div>
      </div>

      {/* Chess Board */}
      <div className="flex justify-center">
        <div className="inline-block p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-2xl">
          <div className="grid grid-cols-8 gap-0 border-4 border-amber-800 rounded">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0
                const isSelected = selectedSquare?.[0] === rowIndex && selectedSquare?.[1] === colIndex
                
                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-16 h-16 flex items-center justify-center text-4xl font-bold
                      transition-all duration-200 relative overflow-hidden
                      ${isLight 
                        ? 'bg-amber-50 hover:bg-amber-100' 
                        : 'bg-amber-600 hover:bg-amber-700'
                      }
                      ${isSelected 
                        ? 'ring-4 ring-gaming-primary bg-gaming-primary/20' 
                        : ''
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    disabled={gameStatus !== 'playing' || isPaused}
                  >
                    {piece && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`
                          drop-shadow-lg
                          ${piece.color === 'white' ? 'text-gray-100' : 'text-gray-800'}
                        `}
                      >
                        {getPieceSymbol(piece)}
                      </motion.span>
                    )}
                    
                    {/* Square coordinates */}
                    {rowIndex === 7 && (
                      <span className="absolute bottom-1 right-1 text-xs text-amber-800 font-mono">
                        {String.fromCharCode(97 + colIndex)}
                      </span>
                    )}
                    {colIndex === 0 && (
                      <span className="absolute top-1 left-1 text-xs text-amber-800 font-mono">
                        {8 - rowIndex}
                      </span>
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Game Status */}
      {gameStatus === 'ended' && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <GamingCard variant="neon" className="p-6">
            <h3 className="text-2xl font-orbitron font-bold mb-2">
              {winner === 'draw' ? 'Unentschieden!' : `${winner === 'white' ? 'Weiß' : 'Schwarz'} gewinnt!`}
            </h3>
            <p className="text-muted-foreground mb-4">
              Glückwunsch! Du hast {winner !== 'draw' ? '50' : '25'} XP erhalten.
            </p>
            <GamingButton onClick={handleRestart} glow>
              Neue Partie
            </GamingButton>
          </GamingCard>
        </motion.div>
      )}

      {/* Move History */}
      {moveHistory.length > 0 && (
        <GamingCard variant="default" className="p-4">
          <h4 className="font-semibold mb-2">Zug-Historie</h4>
          <div className="flex flex-wrap gap-2 text-sm font-mono">
            {moveHistory.map((move, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary rounded text-muted-foreground"
              >
                {index + 1}. {move}
              </span>
            ))}
          </div>
        </GamingCard>
      )}
    </div>
  )
}
