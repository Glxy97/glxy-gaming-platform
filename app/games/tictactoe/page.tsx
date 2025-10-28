'use client'

import { TicTacToeEngine } from '@/components/games/board/tictactoe-engine'
import { useSearchParams, useRouter } from 'next/navigation'
import { RoomMenu } from '@/components/rooms/RoomMenu'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Users, Bot, Globe, Play, ArrowLeft,
  Cpu, Zap, Trophy, Target, Crown
} from 'lucide-react'

type GameMode = 'ai' | 'online' | 'local'
type BotDifficulty = 'easy' | 'medium' | 'hard'

function TicTacToeGameContent() {
  const params = useSearchParams()
  const router = useRouter()
  const roomId = params?.get('roomId') || params?.get('room')
  const mode = params?.get('mode') as GameMode | null
  const difficulty = params?.get('difficulty') as BotDifficulty | null

  const [gameStarted, setGameStarted] = useState<boolean>(!!mode)
  const [selectedMode, setSelectedMode] = useState<GameMode>(mode || 'ai')
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>(difficulty || 'medium')

  const handleStartGame = (gameMode: GameMode, botDifficulty?: BotDifficulty) => {
    setSelectedMode(gameMode)
    if (botDifficulty) setSelectedDifficulty(botDifficulty)
    setGameStarted(true)

    // Update URL params
    const newParams = new URLSearchParams()
    newParams.set('mode', gameMode)
    if (gameMode === 'ai' && botDifficulty) {
      newParams.set('difficulty', botDifficulty)
    }
    if (roomId) newParams.set('roomId', roomId)

    const newUrl = `/games/tictactoe?${newParams.toString()}`
    window.history.pushState({}, '', newUrl)
  }

  const handleLeaveRoom = () => {
    router.push('/games')
  }

  if (gameStarted) {
    return (
      <div className="space-y-4">
        {/* Room Info Bar */}
        {roomId && (
          <Card className="bg-white/80 backdrop-blur border-purple-300">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-purple-700">Room:</span>
                    <span className="font-mono font-bold ml-2">{roomId}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(roomId)}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <RoomMenu roomId={roomId} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tic-Tac-Toe Game */}
        <TicTacToeEngine
          roomId={roomId || undefined}
          gameMode={selectedMode}
          botDifficulty={selectedDifficulty}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    )
  }

  // Game Mode Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-purple-900 mb-3">
            ⭕ Tic-Tac-Toe Championship
          </h1>
          <p className="text-purple-700 text-lg">
            Choose your game mode and start playing!
          </p>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* AI Mode */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="h-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedMode('ai')}
            >
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <CardTitle className="text-2xl text-blue-900 flex items-center justify-center gap-2">
                  <Cpu className="h-6 w-6" />
                  vs Computer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-blue-700">
                  Play against our intelligent Tic-Tac-Toe AI. Perfect for quick strategy practice!
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-blue-800">Select Difficulty:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'easy', label: 'Easy', icon: '😊', desc: 'Makes mistakes sometimes' },
                      { key: 'medium', label: 'Medium', icon: '🤔', desc: 'Balanced gameplay' },
                      { key: 'hard', label: 'Hard', icon: '😤', desc: 'Perfect strategy (unbeatable)' }
                    ].map((diff) => (
                      <Button
                        key={diff.key}
                        variant={selectedDifficulty === diff.key ? 'default' : 'outline'}
                        size="sm"
                        className={selectedDifficulty === diff.key ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDifficulty(diff.key as BotDifficulty)
                        }}
                      >
                        <span className="mr-1">{diff.icon}</span>
                        <div className="text-left">
                          <div>{diff.label}</div>
                          <div className="text-xs opacity-75">{diff.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleStartGame('ai', selectedDifficulty)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start vs AI
                </Button>

                <div className="flex justify-center gap-2 text-xs text-blue-600">
                  <Badge variant="outline">No API Key</Badge>
                  <Badge variant="outline">Offline Mode</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Online Multiplayer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="h-full bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedMode('online')}
            >
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">🌐</div>
                <CardTitle className="text-2xl text-green-900 flex items-center justify-center gap-2">
                  <Globe className="h-6 w-6" />
                  Online Match
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-green-700">
                  Play against other players online in real-time matches with live synchronization!
                </p>

                <div className="space-y-3">
                  <div className="bg-green-200/50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-green-800 font-bold">
                      <Zap className="h-4 w-4" />
                      Real-time Gameplay
                    </div>
                  </div>

                  <div className="bg-green-200/50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-green-800 font-bold">
                      <Users className="h-4 w-4" />
                      1v1 Quick Matches
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleStartGame('online')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Find Match
                </Button>

                <div className="flex justify-center gap-2 text-xs text-green-600">
                  <Badge variant="outline">Live Sync</Badge>
                  <Badge variant="outline">WebSocket</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Local 2 Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:border-purple-400 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedMode('local')}
            >
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">👥</div>
                <CardTitle className="text-2xl text-purple-900 flex items-center justify-center gap-2">
                  <Users className="h-6 w-6" />
                  Local 2P
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-purple-700">
                  Play against a friend on the same device. Take turns and enjoy classic Tic-Tac-Toe!
                </p>

                <div className="space-y-3">
                  <div className="bg-purple-200/50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-purple-800 font-bold">
                      <Crown className="h-4 w-4" />
                      Turn-based
                    </div>
                  </div>

                  <div className="bg-purple-200/50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-purple-800 font-bold">
                      <Trophy className="h-4 w-4" />
                      Local Match
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleStartGame('local')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Local Game
                </Button>

                <div className="flex justify-center gap-2 text-xs text-purple-600">
                  <Badge variant="outline">Same Device</Badge>
                  <Badge variant="outline">No Network</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Features Showcase */}
        <motion.div
          className="bg-white/60 backdrop-blur rounded-xl p-6 border border-purple-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-purple-900 text-center mb-6">
            ✨ Tic-Tac-Toe Championship Features
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🤖', title: 'Smart AI', desc: 'Minimax algorithm with 3 difficulties' },
              { icon: '⚡', title: 'Real-time', desc: 'Live multiplayer synchronization' },
              { icon: '🎨', title: 'Clean UI', desc: 'Simple and elegant interface' },
              { icon: '⭕', title: 'Classic Rules', desc: 'Traditional Tic-Tac-Toe gameplay' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="font-bold text-purple-900 mb-1">{feature.title}</h4>
                <p className="text-xs text-purple-700">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="outline"
            onClick={() => router.push('/games')}
            className="border-purple-400 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default function TicTacToeGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">⭕ Loading Tic-Tac-Toe...</div>
      </div>
    }>
      <TicTacToeGameContent />
    </Suspense>
  )
}