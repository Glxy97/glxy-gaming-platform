'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { GamingButton } from '@/components/ui/gaming-button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Bot, MessageCircle, X, Minimize2, Maximize2, Loader2, User, Send, Sparkles } from 'lucide-react'

type Role = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: Role
  content: string
  createdAt: string
}

interface ChatbotWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'gaming'
  title?: string
  welcomeMessage?: string
  primaryColor?: string
  showBranding?: boolean
  maxHeight?: number
}

export function ChatbotWidget({
  position = 'bottom-right',
  theme = 'gaming',
  title = 'GLXY AI Assistant',
  welcomeMessage = 'Hallo! Ich bin dein intelligenter Gaming-Assistent. Ich kann dir bei Spielstrategien, Programmierung, Technologie und vielen anderen Themen helfen. Was möchtest du wissen?',
  primaryColor,
  showBranding = true,
  maxHeight = 480,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Gaming theme colors
  const themeColors = {
    gaming: {
      primary: 'rgb(var(--gaming-primary))',
      background: 'hsl(var(--background))',
      card: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
    },
    dark: {
      primary: '#3b82f6',
      background: '#1f2937',
      card: '#374151',
      border: '#4b5563',
    },
    light: {
      primary: '#2563eb',
      background: '#ffffff',
      card: '#f9fafb',
      border: '#e5e7eb',
    }
  }

  const currentTheme = themeColors[theme]
  const activeColor = primaryColor || currentTheme.primary

  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('chatbot_widget_session_id') : null
    const sid = stored || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`)
    if (!stored && typeof window !== 'undefined') localStorage.setItem('chatbot_widget_session_id', sid)
    setSessionId(sid)
    void loadChatHistory(sid)
  }, [])

  const loadChatHistory = async (sid: string) => {
    setConnectionStatus('connecting')
    try {
      const res = await fetch('/api/chatbot', {
        headers: { 'x-session-id': sid },
        signal: AbortSignal.timeout(10000)
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data?.conversation?.messages || [])
        setConnectionStatus('connected')
      } else {
        throw new Error(`Server error: ${res.status}`)
      }
    } catch (e) {
      console.error('Failed to load chat history:', e)
      setConnectionStatus('disconnected')
      if (isOpen) {
        toast({
          title: 'Verbindungsfehler',
          description: 'Chat-Historie konnte nicht geladen werden.',
          variant: 'destructive'
        })
      }
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || connectionStatus === 'disconnected') return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)
    setConnectionStatus('connecting')

    const userMessage: ChatMessage = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({ message: messageText }),
        signal: AbortSignal.timeout(30000)
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(data?.conversation?.messages || [])
        setConnectionStatus('connected')

        // Success toast for first message
        if (messages.length === 0) {
          toast({
            title: 'AI Assistant aktiviert!',
            description: 'Dein intelligenter Gaming-Assistent ist bereit.',
          })
        }
      } else {
        throw new Error(`Server error: ${res.status}`)
      }
    } catch (e: any) {
      console.error('Error sending message:', e)
      setConnectionStatus('disconnected')

      const errorMessage = e.name === 'TimeoutError'
        ? 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.'
        : 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte später erneut versuchen.'

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content: errorMessage,
          createdAt: new Date().toISOString(),
        },
      ])

      toast({
        title: 'Nachricht fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  if (!isOpen) {
    return (
      <motion.div
        className={`fixed ${positionClasses[position]} z-50`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative">
          <GamingButton
            onClick={() => setIsOpen(true)}
            className="shadow-lg rounded-full w-16 h-16 p-0 flex items-center justify-center group"
            glow
            style={{ backgroundColor: activeColor }}
          >
            <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            {connectionStatus === 'connected' && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </GamingButton>

          {showBranding && (
            <motion.div
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Badge variant="secondary" className="text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                KI-Assistent
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50 w-80 md:w-96`}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <GamingCard variant="glass" className="shadow-2xl border-0 overflow-hidden backdrop-blur-xl">
        <div
          className="pb-3 px-4 py-3 border-none"
          style={{ backgroundColor: activeColor, color: 'white' }}
        >
          <div className="flex items-center justify-between">
            <div className="text-white text-lg flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <motion.div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' :
                    connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  animate={{ scale: connectionStatus === 'connecting' ? [1, 1.2, 1] : 1 }}
                  transition={{ repeat: connectionStatus === 'connecting' ? Infinity : 0, duration: 1 }}
                />
              </div>
              <div>
                <div className="font-bold">{title}</div>
                <div className="text-xs text-white/80">
                  {connectionStatus === 'connected' ? 'Online' :
                   connectionStatus === 'connecting' ? 'Verbinde...' : 'Offline'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <GamingButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-2 h-9 w-9"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </GamingButton>
              <GamingButton
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 h-9 w-9"
              >
                <X className="h-4 w-4" />
              </GamingButton>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <GamingCardContent className="p-0">
            <ScrollArea className="w-full" style={{ height: `${maxHeight}px` }}>
              <div className="p-4 space-y-4">
                {messages.length === 0 && (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-16 h-16 bg-gaming-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gaming-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed px-4">{welcomeMessage}</p>

                    {showBranding && (
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {['Gaming-Tipps', 'Programmierung', 'Technologie', 'Kreatives'].map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {messages.map((m, index) => (
                  <motion.div
                    key={m.id}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {m.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gaming-primary/20" style={{ backgroundColor: activeColor }}>
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                      m.role === 'user'
                        ? 'text-white'
                        : 'bg-gaming-secondary/10 border border-gaming-primary/10 text-foreground'
                    }`} style={m.role === 'user' ? { backgroundColor: activeColor } : {}}>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                      <p className={`text-xs mt-2 ${
                        m.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(m.createdAt)}
                      </p>
                    </div>

                    {m.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gaming-primary/20 rounded-full flex items-center justify-center border-2 border-gaming-primary/30">
                          <User className="h-4 w-4 text-gaming-primary" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    className="flex gap-3 justify-start"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gaming-primary/20" style={{ backgroundColor: activeColor }}>
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-gaming-primary/10 px-4 py-3 rounded-2xl border border-gaming-primary/20">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-gaming-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gaming-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gaming-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="ml-2 text-xs text-muted-foreground">KI denkt nach...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-gaming-primary/10 p-4 bg-gaming-primary/5">
              <div className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={connectionStatus === 'connected' ? "Stelle deine Frage..." : "Verbindung wird hergestellt..."}
                  disabled={isLoading || connectionStatus !== 'connected'}
                  className="flex-1 text-sm bg-background border-gaming-primary/20 focus:border-gaming-primary"
                />
                <GamingButton
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
                  size="sm"
                  glow={!!inputMessage.trim()}
                  style={{ backgroundColor: activeColor }}
                  className="text-white px-4 py-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </GamingButton>
              </div>

              {showBranding && (
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-gaming-primary/10">
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Powered by GLXY AI
                  </Badge>
                </div>
              )}
            </div>
          </GamingCardContent>
        )}
      </GamingCard>
    </motion.div>
  )
}

export default ChatbotWidget