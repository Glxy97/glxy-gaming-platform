/**
 * Notification Service
 * Helper functions for creating and sending notifications
 */

import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis-server'

async function sendRealtimeNotification(notification: any) {
  try {
    // Store in Redis for real-time delivery
    const realtimeData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      sender: notification.sender,
      createdAt: notification.createdAt,
      actionUrl: notification.actionUrl
    }

    // Add to user's real-time notification queue
    await redis.lpush(
      `notifications:${notification.recipientId}`,
      JSON.stringify(realtimeData)
    )

    // Set expiry for the queue (7 days)
    await redis.expire(`notifications:${notification.recipientId}`, 604800)

    // Publish to Socket.IO channel
    await redis.publish(
      `user:${notification.recipientId}:notifications`,
      JSON.stringify(realtimeData)
    )
  } catch (error) {
    console.error('Real-time notification error:', error)
  }
}

async function sendPushNotification(notification: any) {
  try {
    // TODO: Implement user preferences and push subscription fields in User model
    // Get user's push subscription from database
    const user = await prisma.user.findUnique({
      where: { id: notification.recipientId },
      select: {
        id: true
      }
    })

    if (!user) {
      return
    }

    // TODO: Check user preferences and push subscription when fields are available
    // if (!user?.preferences?.notifications || !user.pushSubscription) {
    //   return
    // }

    // Format for web push
    const pushPayload = {
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.type,
      data: {
        notificationId: notification.id,
        type: notification.type,
        actionUrl: notification.actionUrl,
        ...notification.data
      },
      actions: [] as Array<{ action: string; title: string; icon: string }>
    }

    // Add action buttons based on notification type
    switch (notification.type) {
      case 'friend_request':
        pushPayload.actions = [
          { action: 'accept', title: 'Annehmen', icon: '/icons/check.png' },
          { action: 'decline', title: 'Ablehnen', icon: '/icons/x.png' }
        ]
        break
      case 'game_invite':
        pushPayload.actions = [
          { action: 'join', title: 'Beitreten', icon: '/icons/play.png' },
          { action: 'decline', title: 'Ablehnen', icon: '/icons/x.png' }
        ]
        break
      case 'match_found':
        pushPayload.actions = [
          { action: 'join', title: 'Spiel beitreten', icon: '/icons/play.png' }
        ]
        break
    }

    // Send via web push service (would need actual implementation)
    // await webpush.sendNotification(user.pushSubscription, JSON.stringify(pushPayload))
  } catch (error) {
    console.error('Push notification error:', error)
  }
}

/**
 * Create a notification for a user
 * Helper function for other parts of the application
 */
export async function createNotification(
  type: string,
  title: string,
  message: string,
  recipientId: string,
  senderId?: string,
  data?: any,
  priority: string = 'medium',
  actionUrl?: string
) {
  try {
    // TODO: Implement Notification model in Prisma schema
    const notification = {
      id: Math.random().toString(36),
      type,
      title,
      message,
      recipientId,
      senderId,
      data,
      priority,
      actionUrl,
      createdAt: new Date()
    }

    await sendRealtimeNotification(notification)
    await sendPushNotification(notification)

    return notification
  } catch (error) {
    console.error('Create notification error:', error)
    throw error
  }
}

/**
 * Format time ago string
 */
export function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Gerade eben'
  if (diffMinutes < 60) return `vor ${diffMinutes} Min`
  if (diffHours < 24) return `vor ${diffHours} Std`
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
  return date.toLocaleDateString('de-DE')
}
