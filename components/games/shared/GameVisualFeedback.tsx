/**
 * 🎨 GAME VISUAL FEEDBACK
 *
 * Visual feedback system for keyboard blocking and game events
 * Shows subtle notifications when browser defaults are prevented
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Volume2, Info } from 'lucide-react'

export interface VisualFeedbackConfig {
  enabled?: boolean
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  debugMode?: boolean
}

interface FeedbackItem {
  id: string
  message: string
  type: 'keyboard' | 'success' | 'error' | 'info'
  timestamp: number
}

export function GameVisualFeedbackComponent({ config = {} }: { config?: VisualFeedbackConfig }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [enabled, setEnabled] = useState(config.enabled ?? true)
  const [duration] = useState(config.duration ?? 2000)
  const [position] = useState(config.position ?? 'top-right')

  // Auto-cleanup old feedbacks
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedbacks(prev => prev.filter(item =>
        Date.now() - item.timestamp < 3000
      ))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const addFeedback = useCallback((message: string, type: FeedbackItem['type'] = 'info') => {
    if (!enabled) return

    const newItem: FeedbackItem = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now()
    }

    setFeedbacks(prev => [...prev, newItem])

    // Auto-remove after duration
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(item => item.id !== newItem.id))
    }, duration)
  }, [enabled, duration])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  const getIcon = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'keyboard':
        return <Shield className="w-4 h-4" />
      case 'success':
        return <div className="w-4 h-4 rounded-full bg-green-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
      case 'info':
        return <Info className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getColors = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'keyboard':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="fixed z-50 pointer-events-none">
      <AnimatePresence>
        {feedbacks.map((feedback) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{
              duration: 300,
              ease: "easeOutQuart"
            }}
            className={`absolute ${getPositionClasses()} flex items-center gap-2 px-3 py-2 rounded-lg border ${getColors(feedback.type)} shadow-lg backdrop-blur-sm`}
          >
            {getIcon(feedback.type)}
            <span className="text-sm font-medium">
              {feedback.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Global visual feedback manager
class VisualFeedbackManager {
  private static instance: VisualFeedbackManager | null = null
  private callbacks: ((feedback: FeedbackItem) => void)[] = []

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): VisualFeedbackManager {
    if (!VisualFeedbackManager.instance) {
      VisualFeedbackManager.instance = new VisualFeedbackManager()
    }
    return VisualFeedbackManager.instance
  }

  addCallback(callback: (feedback: FeedbackItem) => void): void {
    this.callbacks.push(callback)
  }

  removeCallback(callback: (feedback: FeedbackItem) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  notify(feedback: FeedbackItem): void {
    this.callbacks.forEach(callback => callback(feedback))
  }
}

export const GameVisualFeedback = {
  showKeyboardBlocked: (key: string) => {
    const manager = VisualFeedbackManager.getInstance()
    const feedback: FeedbackItem = {
      id: `keyboard-${Date.now()}`,
      message: `Key blocked: ${key}`,
      type: 'keyboard',
      timestamp: Date.now()
    }
    manager.notify(feedback)
  },

  showSuccess: (message: string) => {
    const manager = VisualFeedbackManager.getInstance()
    const feedback: FeedbackItem = {
      id: `success-${Date.now()}`,
      message,
      type: 'success',
      timestamp: Date.now()
    }
    manager.notify(feedback)
  },

  showError: (message: string) => {
    const manager = VisualFeedbackManager.getInstance()
    const feedback: FeedbackItem = {
      id: `error-${Date.now()}`,
      message,
      type: 'error',
      timestamp: Date.now()
    }
    manager.notify(feedback)
  },

  showInfo: (message: string) => {
    const manager = VisualFeedbackManager.getInstance()
    const feedback: FeedbackItem = {
      id: `info-${Date.now()}`,
      message,
      type: 'info',
      timestamp: Date.now()
    }
    manager.notify(feedback)
  }
}

export default GameVisualFeedbackComponent