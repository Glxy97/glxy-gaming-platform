// @ts-nocheck

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageCircle, Users } from 'lucide-react'
import { Socket } from 'socket.io-client'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { GamingButton } from '@/components/ui/gaming-button'

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  type?: 'user' | 'system'
}

interface ChessChatProps {
  roomId: string | null
  socket: Socket | null
  username: string
}

export function ChessChat({ roomId, socket, username }: ChessChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'System',
      message: 'Willkommen im Schach-Chat! Viel Spaß beim Spiel!',
      timestamp: new Date().toISOString(),
      type: 'system'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleChatMessage = (data: { message: string; user: string; timestamp: string }) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user: data.user,
        message: data.message,
        timestamp: data.timestamp,
        type: 'user'
      }
      setMessages(prev => [...prev, newMessage])
    }

    const handleRoomJoined = () => {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'System',
        message: 'Ein Spieler ist dem Raum beigetreten',
        timestamp: new Date().toISOString(),
        type: 'system'
      }
      setMessages(prev => [...prev, systemMessage])
    }

    const handleRoomLeft = () => {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'System',
        message: 'Ein Spieler hat den Raum verlassen',
        timestamp: new Date().toISOString(),
        type: 'system'
      }
      setMessages(prev => [...prev, systemMessage])
    }

    socket.on('chat:message', handleChatMessage)
    socket.on('room:joined', handleRoomJoined)
    socket.on('room:left', handleRoomLeft)

    return () => {
      socket.off('chat:message', handleChatMessage)
      socket.off('room:joined', handleRoomJoined)
      socket.off('room:left', handleRoomLeft)
    }
  }, [socket])

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !socket || !roomId) return

    const messageData = {
      roomId,
      message: inputMessage.trim(),
      user: username
    }

    socket.emit('chat:send', messageData)
    setInputMessage('')
    inputRef.current?.focus()
  }

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    
    // Simple typing indicator logic
    if (!isTyping) {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 3000)
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Pre-defined quick messages
  const quickMessages = [
    'Guter Zug! 👏',
    'Viel Glück! 🍀',
    'Danke für das Spiel! 😊',
    'Remis? 🤝',
    'Beeindruckend! 🎯'
  ]

  return (
    <GamingCard variant="glass" className="h-[600px] flex flex-col">
      <GamingCardHeader className="flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gaming-primary/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-gaming-primary" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold">Spiel-Chat</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              2 Spieler online
            </p>
          </div>
        </div>
      </GamingCardHeader>

      <GamingCardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${
                message.user === username ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'system'
                    ? 'bg-muted text-center text-sm text-muted-foreground'
                    : message.user === username
                    ? 'bg-gaming-primary text-white'
                    : 'bg-card border border-border'
                }`}
              >
                {message.type !== 'system' && message.user !== username && (
                  <div className="text-xs text-gaming-primary font-semibold mb-1">
                    {message.user}
                  </div>
                )}
                <div className="text-sm leading-relaxed">{message.message}</div>
              </div>
              {message.type !== 'system' && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Messages */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {quickMessages.map((msg, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(msg)}
                className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Nachricht eingeben..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-gaming-primary text-sm"
              maxLength={200}
            />
            <GamingButton
              type="submit"
              size="sm"
              disabled={!inputMessage.trim()}
              glow
            >
              <Send className="w-4 h-4" />
            </GamingButton>
          </form>
          
          {isTyping && (
            <div className="text-xs text-muted-foreground mt-2 animate-pulse">
              Jemand schreibt...
            </div>
          )}
        </div>
      </GamingCardContent>
    </GamingCard>
  )
}
