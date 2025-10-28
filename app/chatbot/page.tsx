'use client'

import { motion } from 'framer-motion'
import { GamingCard, GamingCardContent, GamingCardHeader } from '@/components/ui/gaming-card'
import { Badge } from '@/components/ui/badge'
import ChatbotWidget from '@/components/chat/ChatbotWidget'
import Link from 'next/link'
import { Bot, Sparkles, MessageCircle, ArrowLeft } from 'lucide-react'

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/5 via-gaming-secondary/3 to-gaming-accent/5" />
        <div className="absolute inset-0 gaming-grid opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/tools" className="inline-block mb-4 text-gaming-primary hover:text-gaming-primary/80">
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            Zurück zu Tools
          </Link>
          <h1 className="text-4xl font-orbitron font-bold gradient-text mb-4">
            🤖 GLXY AI Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dein intelligenter Gaming- und Programmier-Assistent für alle Fragen rund um Technologie, Spiele und Entwicklung.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          {[
            {
              icon: '🎮',
              title: 'Gaming-Expertise',
              description: 'Strategien für Chess, Racing, UNO, FPS und mehr'
            },
            {
              icon: '💻',
              title: 'Programmierung',
              description: 'JavaScript, TypeScript, React, Next.js, CSS'
            },
            {
              icon: '🛠️',
              title: 'Technologie',
              description: 'Web-Development, APIs, Datenbanken, DevOps'
            },
            {
              icon: '🎨',
              title: 'Kreatives',
              description: 'UI/UX Design, Projektplanung, Problemlösung'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <GamingCard variant="default" className="text-center h-full">
                <GamingCardContent className="p-6">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </GamingCardContent>
              </GamingCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <GamingCard variant="glass" className="overflow-hidden">
            <GamingCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gaming-primary/20 flex items-center justify-center text-gaming-primary">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">KI-Chat Interface</h2>
                    <p className="text-sm text-muted-foreground">Stelle deine Fragen direkt hier oder verwende das Widget</p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Online
                </Badge>
              </div>
            </GamingCardHeader>
            <GamingCardContent className="p-0">
              <div className="h-[600px] bg-background/50 border rounded-lg relative">
                <ChatbotWidget
                  position="bottom-right"
                  theme="gaming"
                  maxHeight={600}
                  showBranding={false}
                />

                {/* Instructions Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gaming-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-gaming-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Klicke auf den Chat-Button</h3>
                    <p className="text-muted-foreground">
                      Der GLXY AI Assistant ist bereit für deine Fragen!
                    </p>
                  </div>
                </div>
              </div>
            </GamingCardContent>
          </GamingCard>
        </motion.div>

        {/* Example Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto mt-8"
        >
          <GamingCard variant="default">
            <GamingCardHeader>
              <h3 className="text-lg font-semibold">💡 Beispiel-Fragen</h3>
            </GamingCardHeader>
            <GamingCardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2 text-gaming-primary">Gaming</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Wie kann ich beim Schach besser werden?</li>
                    <li>• Welche UNO-Strategien gibt es?</li>
                    <li>• Tipps für Racing-Games?</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gaming-primary">Programmierung</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Wie funktioniert React useEffect?</li>
                    <li>• CSS Grid vs Flexbox erklären</li>
                    <li>• Next.js API Routes verwenden</li>
                  </ul>
                </div>
              </div>
            </GamingCardContent>
          </GamingCard>
        </motion.div>
      </div>
    </div>
  )
}