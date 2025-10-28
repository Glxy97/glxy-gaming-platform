// @ts-nocheck

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Settings, 
  Volume2, 
  VolumeX, 
  Crown, 
  Zap, 
  RotateCw,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Plus,
  Shuffle,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// UNO Card Types
type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild'
type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4'

interface UnoCard {
  id: string
  color: CardColor
  type: CardType
  value?: number // 0-9 for number cards
  isPlayable?: boolean
}

interface Player {
  id: string
  name: string
  cards: UnoCard[]
  isBot: boolean
  avatar?: string
  score: number
}

interface GameSettings {
  mode: 'single' | 'online' | 'friends'
  players: number
  difficulty: 'easy' | 'medium' | 'hard'
  soundEnabled: boolean
  animationsEnabled: boolean
  fastPlay: boolean
  houseRules: {
    stacking: boolean // +2 and +4 cards can stack
    jumpIn: boolean // Same card can be played out of turn
    zeroRotation: boolean // 0 cards rotate hands
    drawUntilPlayable: boolean
  }
}

const defaultSettings: GameSettings = {
  mode: 'single',
  players: 4,
  difficulty: 'medium',
  soundEnabled: true,
  animationsEnabled: true,
  fastPlay: false,
  houseRules: {
    stacking: false,
    jumpIn: false,
    zeroRotation: false,
    drawUntilPlayable: false
  }
}

const cardColors = {
  red: 'bg-red-500 text-white border-red-600',
  yellow: 'bg-yellow-400 text-black border-yellow-500',
  green: 'bg-green-500 text-white border-green-600',
  blue: 'bg-blue-500 text-white border-blue-600',
  wild: 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-700'
}

const cardEmojis = {
  skip: '🚫',
  reverse: '🔄',
  draw2: '+2',
  wild: '🌈',
  wild_draw4: '🌈+4'
}

import { useSocket } from '@/components/providers/socket-provider'

interface UnoOnlineProps {
  roomId?: string
  gameMode?: 'single' | 'online' | 'friends'
  botDifficulty?: 'easy' | 'medium' | 'hard'
  onLeaveRoom?: () => void
}

export function UnoOnline({
  roomId,
  gameMode = 'single',
  botDifficulty = 'medium',
  onLeaveRoom
}: UnoOnlineProps) {
  const [settings, setSettings] = useState<GameSettings>({
    ...defaultSettings,
    mode: gameMode,
    difficulty: botDifficulty
  })
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setPaused] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [direction, setDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise')
  const [deck, setDeck] = useState<UnoCard[]>([])
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([])
  const [drawCount, setDrawCount] = useState(0)
  const [isWildColorSelection, setWildColorSelection] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [winner, setWinner] = useState<Player | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const { socket, isConnected } = useSocket()
  const [onlineState, setOnlineState] = useState<any | null>(null)
  const [playedCardAnimation, setPlayedCardAnimation] = useState<{card: UnoCard, startX: number, startY: number, endX: number, endY: number} | null>(null)
  const [drawnCardAnimation, setDrawnCardAnimation] = useState<{card: UnoCard, startX: number, startY: number, endX: number, endY: number} | null>(null)

  // Create a complete UNO deck
  const createDeck = (): UnoCard[] => {
    const cards: UnoCard[] = []
    const colors: CardColor[] = ['red', 'yellow', 'green', 'blue']
    
    colors.forEach(color => {
      // Number cards (0-9, with 0 appearing once, others twice)
      for (let num = 0; num <= 9; num++) {
        const count = num === 0 ? 1 : 2
        for (let i = 0; i < count; i++) {
          cards.push({
            id: `${color}-${num}-${i}`,
            color,
            type: 'number',
            value: num
          })
        }
      }
      
      // Action cards (2 of each per color)
      const actions: CardType[] = ['skip', 'reverse', 'draw2']
      actions.forEach(action => {
        for (let i = 0; i < 2; i++) {
          cards.push({
            id: `${color}-${action}-${i}`,
            color,
            type: action
          })
        }
      })
    })
    
    // Wild cards
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `wild-${i}`,
        color: 'wild',
        type: 'wild'
      })
      cards.push({
        id: `wild_draw4-${i}`,
        color: 'wild',
        type: 'wild_draw4'
      })
    }
    
    return shuffleArray(cards)
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const initializeGame = () => {
    const newDeck = createDeck()
    const newPlayers: Player[] = []
    
    // Create players
    newPlayers.push({
      id: 'human',
      name: 'You',
      cards: [],
      isBot: false,
      score: 0
    })
    
    // Add bots
    const botNames = ['Emma AI', 'Max Bot', 'Luna 🤖', 'Alex CPU', 'Zara AI', 'Neo Bot']
    for (let i = 1; i < settings.players; i++) {
      newPlayers.push({
        id: `bot-${i}`,
        name: botNames[i - 1] || `Bot ${i}`,
        cards: [],
        isBot: true,
        score: 0
      })
    }
    
    // Deal 7 cards to each player
    let deckIndex = 0
    newPlayers.forEach(player => {
      player.cards = newDeck.slice(deckIndex, deckIndex + 7)
      deckIndex += 7
    })
    
    // Set up discard pile with first non-wild card
    const remainingDeck = newDeck.slice(deckIndex)
    let firstCard = remainingDeck[0]
    let discardIndex = 0
    
    // Ensure first card isn't a wild
    while (firstCard.color === 'wild') {
      discardIndex++
      firstCard = remainingDeck[discardIndex]
    }
    
    const finalDeck = remainingDeck.slice(discardIndex + 1)
    
    setPlayers(newPlayers)
    setDeck(finalDeck)
    setDiscardPile([firstCard])
    setCurrentPlayerIndex(0)
    setDirection('clockwise')
    setDrawCount(0)
    setGameStatus('playing')
  }

  const canPlayCard = (card: UnoCard): boolean => {
    if (discardPile.length === 0) return false
    
    const topCard = discardPile[discardPile.length - 1]
    
    // Wild cards can always be played
    if (card.color === 'wild') return true
    
    // Match color or type/value
    return card.color === topCard.color || 
           card.type === topCard.type || 
           (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value)
  }

  const playCard = (playerId: string, cardId: string, chosenColor?: CardColor) => {
    if (!gameStarted || isPaused) return
    
    const player = players.find(p => p.id === playerId)
    const card = player?.cards.find(c => c.id === cardId)
    
    if (!player || !card || !canPlayCard(card)) return
    
    // Remove card from player's hand
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? { ...p, cards: p.cards.filter(c => c.id !== cardId) }
        : p
    )
    
    // Add card to discard pile
    const playedCard = chosenColor && card.color === 'wild' 
      ? { ...card, color: chosenColor }
      : card
    
    const newDiscardPile = [...discardPile, playedCard]
    
    setPlayers(updatedPlayers)
    setDiscardPile(newDiscardPile)
    
    // Check for win
    if (player.cards.length === 1) {
      toast.success(`${player.name} says UNO!`, {
        description: "Only one card left!"
      })
    } else if (player.cards.length === 0) {
      setWinner(player)
      setGameStatus('finished')
      return
    }
    
    // Handle special cards
    let nextPlayerSkip = 0
    let drawCards = 0
    
    switch (card.type) {
      case 'skip':
        nextPlayerSkip = 1
        break
      case 'reverse':
        setDirection(prev => prev === 'clockwise' ? 'counterclockwise' : 'clockwise')
        break
      case 'draw2':
        drawCards = 2
        nextPlayerSkip = 1
        break
      case 'wild_draw4':
        drawCards = 4
        nextPlayerSkip = 1
        break
    }
    
    // Move to next player
    const nextIndex = getNextPlayerIndex(currentPlayerIndex, nextPlayerSkip)
    
    // Make next player draw cards if needed
    if (drawCards > 0 && nextIndex !== currentPlayerIndex) {
      drawCardsForPlayer(updatedPlayers[nextIndex].id, drawCards)
    }
    
    setCurrentPlayerIndex(getNextPlayerIndex(nextIndex))
  }

  const getNextPlayerIndex = (currentIndex: number, skip = 0): number => {
    const totalPlayers = players.length
    const increment = direction === 'clockwise' ? 1 : -1
    return (currentIndex + increment * (skip + 1) + totalPlayers) % totalPlayers
  }

  const drawCardsForPlayer = (playerId: string, count: number) => {
    if (deck.length < count) {
      // Reshuffle discard pile into deck
      const newDeck = shuffleArray(discardPile.slice(0, -1))
      setDeck(prev => [...prev, ...newDeck])
      setDiscardPile(prev => [prev[prev.length - 1]])
    }
    
    const drawnCards = deck.slice(0, count)
    setDeck(prev => prev.slice(count))
    
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, cards: [...p.cards, ...drawnCards] }
        : p
    ))
  }

  const handleDrawCard = () => {
    if (currentPlayerIndex !== 0) return // Only human player can manually draw

    // Get drawn card for animation
    const deckElement = document.getElementById('draw-deck')
    const playerHandElement = document.getElementById('player-hand')

    if (deckElement && playerHandElement && settings.animationsEnabled && deck.length > 0) {
      const deckRect = deckElement.getBoundingClientRect()
      const handRect = playerHandElement.getBoundingClientRect()
      const drawnCard = deck[0]

      setDrawnCardAnimation({
        card: drawnCard,
        startX: deckRect.left + deckRect.width / 2,
        startY: deckRect.top + deckRect.height / 2,
        endX: handRect.left + handRect.width / 2,
        endY: handRect.top + handRect.height / 2
      })
    }

    drawCardsForPlayer('human', 1)

    if (!settings.houseRules.drawUntilPlayable) {
      setCurrentPlayerIndex(getNextPlayerIndex(currentPlayerIndex))
    }
  }

  // Bot AI
  useEffect(() => {
    if (!gameStarted || isPaused || gameStatus !== 'playing') return
    
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer?.isBot) return
    
    const timeout = setTimeout(() => {
      // Simple AI: play first playable card or draw
      const playableCards = currentPlayer.cards.filter(canPlayCard)
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0]
        let chosenColor: CardColor | undefined
        
        if (cardToPlay.color === 'wild') {
          // AI chooses color based on most frequent color in hand
          const colorCounts = { red: 0, yellow: 0, green: 0, blue: 0 }
          currentPlayer.cards.forEach(card => {
            if (card.color !== 'wild') {
              colorCounts[card.color as keyof typeof colorCounts]++
            }
          })
          chosenColor = Object.keys(colorCounts).reduce((a, b) => 
            colorCounts[a as keyof typeof colorCounts] > colorCounts[b as keyof typeof colorCounts] ? a : b
          ) as CardColor
        }
        
        playCard(currentPlayer.id, cardToPlay.id, chosenColor)
      } else {
        // Draw a card
        drawCardsForPlayer(currentPlayer.id, 1)
        setCurrentPlayerIndex(getNextPlayerIndex(currentPlayerIndex))
      }
    }, settings.fastPlay ? 500 : 1500)
    
    return () => clearTimeout(timeout)
  }, [currentPlayerIndex, gameStarted, isPaused, gameStatus, players, discardPile, settings.fastPlay])

  const startGame = () => {
    setGameStarted(true)
    initializeGame()
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameStatus('waiting')
    setPlayers([])
    setDeck([])
    setDiscardPile([])
    setCurrentPlayerIndex(0)
    setDirection('clockwise')
    setWinner(null)
    setSelectedCards([])
  }

  const handleCardClick = (cardId: string) => {
    if (currentPlayerIndex !== 0) return // Only human player's turn

    const humanPlayer = players[0]
    const card = humanPlayer?.cards.find(c => c.id === cardId)

    if (!card || !canPlayCard(card)) return

    // Get card position for animation
    const cardElement = document.getElementById(`card-${cardId}`)
    const discardElement = document.getElementById('discard-pile')

    if (cardElement && discardElement && settings.animationsEnabled) {
      const cardRect = cardElement.getBoundingClientRect()
      const discardRect = discardElement.getBoundingClientRect()

      setPlayedCardAnimation({
        card,
        startX: cardRect.left + cardRect.width / 2,
        startY: cardRect.top + cardRect.height / 2,
        endX: discardRect.left + discardRect.width / 2,
        endY: discardRect.top + discardRect.height / 2
      })
    }

    if (card.color === 'wild') {
      setWildColorSelection(true)
      setSelectedCards([cardId])
    } else {
      playCard('human', cardId)
    }
  }

  const handleWildColorChoice = (color: CardColor) => {
    if (selectedCards.length > 0) {
      playCard('human', selectedCards[0], color)
      setSelectedCards([])
    }
    setWildColorSelection(false)
  }

  const formatCardDisplay = (card: UnoCard) => {
    if (card.type === 'number') {
      return card.value?.toString() || '0'
    }
    return cardEmojis[card.type as keyof typeof cardEmojis] || card.type
  }

  // Placeholder functions for online mode (Socket.IO not fully implemented)
  const onlineStart = () => {
    console.log('Online start - Socket.IO not fully implemented')
  }

  const onlineDraw = () => {
    console.log('Online draw - Socket.IO not fully implemented')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-yellow-900 to-green-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-orbitron font-bold gradient-text mb-2">
              🃏 GLXY UNO Online
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={gameStatus === 'playing' ? 'default' : 'secondary'}>
                {gameStatus === 'playing' ? 'Spiel läuft' : gameStatus === 'waiting' ? 'Warten' : 'Beendet'}
              </Badge>
              <span>Spieler: {settings.players}</span>
              <span>Modus: {settings.mode}</span>
              {gameStarted && (
                <span>Am Zug: {players[currentPlayerIndex]?.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>UNO Einstellungen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Spieler Anzahl</Label>
                    <Select value={settings.players.toString()} onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, players: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Spieler</SelectItem>
                        <SelectItem value="3">3 Spieler</SelectItem>
                        <SelectItem value="4">4 Spieler</SelectItem>
                        <SelectItem value="6">6 Spieler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>KI Schwierigkeit</Label>
                    <Select value={settings.difficulty} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Einfach</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="hard">Schwer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Schnelles Spiel</Label>
                    <Switch 
                      checked={settings.fastPlay}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, fastPlay: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Karten stapeln (+2, +4)</Label>
                    <Switch 
                      checked={settings.houseRules.stacking}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          houseRules: { ...prev.houseRules, stacking: checked }
                        }))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Game Controls */}
            {!gameStarted ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                UNO starten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaused(!isPaused)} size="sm">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={resetGame} size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Online Steuerung */}
        {settings.mode === 'online' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Online‑Modus</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'secondary'}>{isConnected ? 'verbunden' : 'offline'}</Badge>
                <span>Room: {roomId || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onlineStart} disabled={!roomId || !isConnected}>Start</Button>
                <Button size="sm" variant="secondary" onClick={onlineDraw} disabled={!roomId || !isConnected}>Karte ziehen</Button>
              </div>
              {onlineState && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Ablagestapel: {onlineState.top?.color} {onlineState.top?.type}{typeof onlineState.top?.value==='number' ? ` ${onlineState.top.value}`:''} • Am Zug: {onlineState.turnUserId?.slice(0,6)}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Opponents */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.slice(1).map((player, index) => (
                  <Card key={player.id} className={`relative ${currentPlayerIndex === index + 1 ? 'ring-2 ring-gaming-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gaming-primary/20 flex items-center justify-center text-sm font-bold">
                            {player.name.charAt(0)}
                          </div>
                          <span className="font-medium">{player.name}</span>
                          {player.isBot && <Badge variant="secondary" className="text-xs">BOT</Badge>}
                        </div>
                        <Badge variant="outline">
                          {player.cards.length} 🃏
                        </Badge>
                      </div>
                      
                      {/* Player's cards (back side) */}
                      <div className="flex flex-wrap gap-1">
                        {player.cards.slice(0, Math.min(10, player.cards.length)).map((_, cardIndex) => (
                          <motion.div
                            key={cardIndex}
                            className="w-8 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded border border-white/20 flex items-center justify-center text-xs"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: cardIndex * 0.05 }}
                          >
                            🃏
                          </motion.div>
                        ))}
                        {player.cards.length > 10 && (
                          <div className="w-8 h-12 bg-gray-600 rounded border border-white/20 flex items-center justify-center text-xs">
                            +{player.cards.length - 10}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Game Table */}
              <Card className="relative bg-green-800/50 border-green-600/50">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-8">
                    {/* Discard Pile - Center Focus */}
                    <div className="relative">
                      <div className="text-center mb-2 text-sm font-medium text-white/80">
                        Ablagestapel
                      </div>
                      <div id="discard-pile" className="relative">
                        <AnimatePresence mode="wait">
                          {discardPile.length > 0 && (
                            <motion.div
                              key={discardPile[discardPile.length - 1].id}
                              className={`w-24 h-32 rounded-lg border-2 flex items-center justify-center text-2xl font-bold shadow-lg ${
                                cardColors[discardPile[discardPile.length - 1].color]
                              }`}
                              initial={{ scale: 0, rotate: 180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: -180 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {formatCardDisplay(discardPile[discardPile.length - 1])}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Stack effect for multiple cards */}
                        {discardPile.length > 1 && (
                          <div className="absolute inset-0 flex flex-col gap-0">
                            {discardPile.slice(-3, -1).map((card, index) => (
                              <motion.div
                                key={card.id}
                                className={`w-24 h-32 rounded-lg border-2 flex items-center justify-center text-xl font-bold opacity-50 ${
                                  cardColors[card.color]
                                }`}
                                style={{
                                  transform: `translate(${-index * 2}px, ${index * 2}px)`,
                                  zIndex: 10 - index
                                }}
                              >
                                {formatCardDisplay(card)}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direction Indicator */}
                    <motion.div
                      className="text-4xl"
                      animate={{ rotate: direction === 'clockwise' ? 0 : 180 }}
                    >
                      ➡️
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {/* Draw Deck - Separate Section Below */}
              <Card className="relative bg-blue-800/30 border-blue-600/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <motion.div
                      id="draw-deck"
                      className="relative cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDrawCard}
                    >
                      <div className="w-20 h-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg">
                        <div className="text-2xl">🃏</div>
                      </div>
                      <Badge className="absolute -top-2 -right-2 bg-purple-600">
                        {deck.length}
                      </Badge>
                      <div className="text-center mt-2 text-sm font-medium">
                        Karte ziehen
                      </div>
                      {/* Stack effect */}
                      {deck.length > 1 && (
                        <div className="absolute inset-0">
                          <div className="w-20 h-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-white/20"
                               style={{ transform: 'translate(-2px, -2px)' }} />
                          <div className="w-20 h-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-white/20"
                               style={{ transform: 'translate(-4px, -4px)' }} />
                        </div>
                      )}
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Player's Hand & Controls */}
            <div className="lg:col-span-4 space-y-4">
              <Card className={`${currentPlayerIndex === 0 ? 'ring-2 ring-gaming-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Deine Karten</span>
                    <Badge>{players[0]?.cards.length || 0} 🃏</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="player-hand" className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {players[0]?.cards.map((card, index) => (
                      <motion.button
                        key={card.id}
                        id={`card-${card.id}`}
                        className={`relative w-full h-24 rounded-lg border-2 flex flex-col items-center justify-center text-lg font-bold shadow-lg transition-all ${
                          cardColors[card.color]
                        } ${
                          canPlayCard(card)
                            ? 'hover:scale-105 hover:shadow-xl cursor-pointer hover:-translate-y-2'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => handleCardClick(card.id)}
                        whileHover={canPlayCard(card) ? { scale: 1.05, y: -8 } : {}}
                        whileTap={canPlayCard(card) ? { scale: 0.95 } : {}}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                        disabled={currentPlayerIndex !== 0 || !canPlayCard(card)}
                      >
                        <div className="text-2xl mb-1">{formatCardDisplay(card)}</div>
                        {card.type === 'number' && (
                          <div className="text-xs opacity-75">{card.value}</div>
                        )}
                        {canPlayCard(card) && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full shadow-lg"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                        {card.color !== 'wild' && (
                          <div className={`absolute top-1 left-1 w-3 h-3 rounded-full ${
                            card.color === 'red' ? 'bg-red-600' :
                            card.color === 'yellow' ? 'bg-yellow-500' :
                            card.color === 'green' ? 'bg-green-600' :
                            'bg-blue-600'
                          }`} />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {currentPlayerIndex === 0 && (
                    <motion.div
                      className="mt-4 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Badge variant="secondary" className="animate-pulse bg-green-600 text-white">
                        🎯 Du bist am Zug!
                      </Badge>
                    </motion.div>
                  )}

                  {/* Turn Indicator */}
                  {currentPlayerIndex !== 0 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline" className="text-gray-400">
                        ⏳ Warte auf {players[currentPlayerIndex]?.name}...
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Game Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Spiel Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Richtung:</span>
                    <span>{direction === 'clockwise' ? '↻ Im Uhrzeigersinn' : '↺ Gegen Uhrzeiger'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Karten im Deck:</span>
                    <span>{deck.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Runde:</span>
                    <span>#{Math.floor((108 - deck.length - players.reduce((sum, p) => sum + p.cards.length, 0)) / 4) + 1}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-8">🃏</div>
            <h2 className="text-2xl font-bold mb-4">Bereit für UNO?</h2>
            <p className="text-muted-foreground mb-8">
              Spiele das klassische Kartenspiel gegen KI-Gegner oder online mit Freunden!
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              UNO Spiel starten
            </Button>
          </div>
        )}

        {/* Wild Color Selection Modal */}
        <AnimatePresence>
          {isWildColorSelection && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card p-6 rounded-xl border shadow-xl"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.5 }}
              >
                <h3 className="text-xl font-bold mb-4 text-center">Wähle eine Farbe</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['red', 'yellow', 'green', 'blue'] as const).map(color => (
                    <Button
                      key={color}
                      className={`h-16 ${cardColors[color]} hover:scale-105 transition-transform`}
                      onClick={() => handleWildColorChoice(color)}
                    >
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Animation Overlay */}
        <AnimatePresence>
          {playedCardAnimation && (
            <motion.div
              className="fixed pointer-events-none z-50"
              initial={{
                x: playedCardAnimation.startX,
                y: playedCardAnimation.startY,
                scale: 1,
                rotate: 0
              }}
              animate={{
                x: playedCardAnimation.endX,
                y: playedCardAnimation.endY,
                scale: 1.2,
                rotate: 360
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                duration: 0.8
              }}
              onAnimationComplete={() => setPlayedCardAnimation(null)}
            >
              <div className={`w-16 h-20 rounded-lg border-2 flex items-center justify-center text-lg font-bold shadow-2xl ${
                cardColors[playedCardAnimation.card.color]
              }`}>
                {formatCardDisplay(playedCardAnimation.card)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draw Card Animation Overlay */}
        <AnimatePresence>
          {drawnCardAnimation && (
            <motion.div
              className="fixed pointer-events-none z-50"
              initial={{
                x: drawnCardAnimation.startX,
                y: drawnCardAnimation.startY,
                scale: 1,
                rotate: 0
              }}
              animate={{
                x: drawnCardAnimation.endX,
                y: drawnCardAnimation.endY,
                scale: 0.8,
                rotate: 180
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.6
              }}
              onAnimationComplete={() => setDrawnCardAnimation(null)}
            >
              <div className="w-16 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-xl">
                <div className="text-xl">🃏</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Modal */}
        <AnimatePresence>
          {winner && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card p-8 rounded-xl border shadow-xl text-center"
                initial={{ scale: 0.5, y: -100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, y: 100 }}
              >
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold mb-4">
                  {winner.name} gewinnt!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Glückwunsch zum Sieg bei UNO!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={resetGame} variant="outline">
                    Neues Spiel
                  </Button>
                  <Button onClick={startGame}>
                    Noch einmal spielen
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
// Dead code removed - was outside component scope
