'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  Check,
  X,
  Trash2,
  Settings,
  Filter,
  MoreVertical,
  User,
  Trophy,
  Gamepad2,
  Calendar,
  AlertCircle,
  Info,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSocket } from '@/lib/socket-client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  timeAgo: string
  actionUrl?: string
  data?: any
  sender?: {
    id: string
    username: string
    avatar?: string
  }
  canDismiss: boolean
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    soundEnabled: true,
    pushEnabled: true,
    emailEnabled: false,
    gameInvites: true,
    friendRequests: true,
    tournaments: true,
    achievements: true,
    systemAnnouncements: true
  })

  const { socket } = useSocket()

  useEffect(() => {
    loadNotifications()

    if (socket) {
      // Listen for real-time notifications
      socket.on('notification', handleNewNotification)
      socket.on('notification_update', handleNotificationUpdate)

      return () => {
        socket.off('notification')
        socket.off('notification_update')
      }
    }
    
    // Return cleanup function even when condition is not met
    return () => {}
  }, [socket])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?limit=50`)

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Play sound if enabled
    if (preferences.soundEnabled) {
      playNotificationSound(notification.priority)
    }

    // Show browser notification if permission granted
    if (preferences.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        tag: notification.id
      })
    }
  }

  const handleNotificationUpdate = (update: any) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === update.id ? { ...notif, ...update } : notif
    ))
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds
        })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        ))
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds
        })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => !notificationIds.includes(notif.id)))
        const unreadDeleted = notifications.filter(n =>
          notificationIds.includes(n.id) && !n.isRead
        ).length
        setUnreadCount(prev => Math.max(0, prev - unreadDeleted))
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const playNotificationSound = (priority: string) => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // Different tones for different priorities
    switch (priority) {
      case 'urgent':
        oscillator.frequency.setValueAtTime(880, context.currentTime)
        break
      case 'high':
        oscillator.frequency.setValueAtTime(660, context.currentTime)
        break
      case 'medium':
        oscillator.frequency.setValueAtTime(440, context.currentTime)
        break
      default:
        oscillator.frequency.setValueAtTime(330, context.currentTime)
    }

    gainNode.gain.setValueAtTime(0, context.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.3)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return <User className="h-4 w-4" />
      case 'achievement_unlocked':
        return <Trophy className="h-4 w-4" />
      case 'level_up':
        return <Star className="h-4 w-4" />
      case 'game_invite':
      case 'match_found':
      case 'game_result':
        return <Gamepad2 className="h-4 w-4" />
      case 'tournament_invite':
        return <Calendar className="h-4 w-4" />
      case 'system_announcement':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-950'
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950'
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-950'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'games') return ['game_invite', 'match_found', 'game_result'].includes(notification.type)
    if (filter === 'social') return ['friend_request', 'friend_accepted'].includes(notification.type)
    if (filter === 'achievements') return ['achievement_unlocked', 'level_up'].includes(notification.type)
    return true
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungen
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} ungelesen</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Alle als gelesen markieren
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => deleteNotifications(notifications.map(n => n.id))}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Alle löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="flex-1 flex flex-col space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle anzeigen</SelectItem>
                  <SelectItem value="unread">Ungelesen</SelectItem>
                  <SelectItem value="games">Spiele</SelectItem>
                  <SelectItem value="social">Sozial</SelectItem>
                  <SelectItem value="achievements">Erfolge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`
                      p-4 rounded-lg border-l-4 transition-colors cursor-pointer
                      ${notification.isRead ? 'opacity-75' : ''}
                      ${getPriorityColor(notification.priority)}
                    `}
                    onClick={() => !notification.isRead && markAsRead([notification.id])}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {notification.timeAgo}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        {notification.sender && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-xs text-muted-foreground">
                              von {notification.sender.username}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={notification.actionUrl}>
                                Anzeigen
                              </a>
                            </Button>
                          )}

                          {notification.type === 'friend_request' && (
                            <>
                              <Button size="sm" variant="default">
                                <Check className="h-3 w-3 mr-1" />
                                Annehmen
                              </Button>
                              <Button size="sm" variant="outline">
                                <X className="h-3 w-3 mr-1" />
                                Ablehnen
                              </Button>
                            </>
                          )}

                          {notification.canDismiss && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotifications([notification.id])
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Benachrichtigungen gefunden</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Benachrichtigungsarten</h4>
                <div className="space-y-3">
                  {[
                    { key: 'gameInvites', label: 'Spieleinladungen', icon: <Gamepad2 className="h-4 w-4" /> },
                    { key: 'friendRequests', label: 'Freundschaftsanfragen', icon: <User className="h-4 w-4" /> },
                    { key: 'tournaments', label: 'Turniere', icon: <Calendar className="h-4 w-4" /> },
                    { key: 'achievements', label: 'Erfolge', icon: <Trophy className="h-4 w-4" /> },
                    { key: 'systemAnnouncements', label: 'System-Ankündigungen', icon: <AlertCircle className="h-4 w-4" /> }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {icon}
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                      <Switch
                        id={key}
                        checked={preferences[key as keyof typeof preferences]}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Benachrichtigungsmethoden</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="soundEnabled">Sound-Benachrichtigungen</Label>
                    <Switch
                      id="soundEnabled"
                      checked={preferences.soundEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="pushEnabled">Browser-Push-Benachrichtigungen</Label>
                    <Switch
                      id="pushEnabled"
                      checked={preferences.pushEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, pushEnabled: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailEnabled">E-Mail-Benachrichtigungen</Label>
                    <Switch
                      id="emailEnabled"
                      checked={preferences.emailEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, emailEnabled: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}