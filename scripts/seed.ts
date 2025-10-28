
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🎮 Seeding GLXY Gaming Platform...')

  // Create achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Welcome to GLXY! You\'ve joined the platform.',
      icon: '🚀',
      xpReward: 50,
      gameType: null,
      conditions: { type: 'register' }
    },
    {
      name: 'Chess Beginner',
      description: 'Play your first chess game.',
      icon: '♟️',
      xpReward: 100,
      gameType: 'chess',
      conditions: { type: 'first_game' }
    },
    {
      name: 'Chess Master',
      description: 'Win 10 chess games.',
      icon: '👑',
      xpReward: 500,
      gameType: 'chess',
      conditions: { type: 'wins', count: 10 }
    },
    {
      name: 'Strategist',
      description: 'Win a chess game in under 20 moves.',
      icon: '⚡',
      xpReward: 200,
      gameType: 'chess',
      conditions: { type: 'quick_win', moves: 20 }
    },
    {
      name: 'Chat Master',
      description: 'Send 100 chat messages.',
      icon: '💬',
      xpReward: 150,
      gameType: null,
      conditions: { type: 'chat_messages', count: 100 }
    }
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement
    })
  }

  // Create test admin account (required for testing)
  const adminPassword = await bcrypt.hash('johndoe123', 12)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      username: 'admin',
      password: adminPassword,
      level: 50,
      globalXP: 25000,
      coins: 10000,
      bio: 'Platform Administrator',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    }
  })

  // Create demo users
  const demoUsers = [
    {
      email: 'gamer1@glxy.at',
      username: 'ChessKing',
      password: await bcrypt.hash('demo123', 12),
      level: 15,
      globalXP: 3500,
      coins: 750,
      bio: 'Chess enthusiast and strategist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    },
    {
      email: 'gamer2@glxy.at',
      username: 'GameMaster',
      password: await bcrypt.hash('demo123', 12),
      level: 22,
      globalXP: 5800,
      coins: 1200,
      bio: 'All-around gaming pro',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face'
    },
    {
      email: 'gamer3@glxy.at',
      username: 'RookiePlayer',
      password: await bcrypt.hash('demo123', 12),
      level: 3,
      globalXP: 450,
      coins: 200,
      bio: 'Just getting started!',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
    }
  ]

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    })
  }

  // Create initial game stats for demo users
  const users = await prisma.user.findMany()
  for (const user of users.slice(0, 4)) {
    await prisma.gameStats.upsert({
      where: {
        userId_gameType: {
          userId: user.id,
          gameType: 'chess'
        }
      },
      update: {},
      create: {
        userId: user.id,
        gameType: 'chess',
        xp: Math.floor(Math.random() * 1000) + 100,
        level: Math.floor(Math.random() * 10) + 1,
        wins: Math.floor(Math.random() * 20),
        losses: Math.floor(Math.random() * 15),
        draws: Math.floor(Math.random() * 5),
        stats: {
          averageGameTime: Math.floor(Math.random() * 1800) + 300,
          fastestWin: Math.floor(Math.random() * 600) + 180,
          longestGame: Math.floor(Math.random() * 3600) + 1800
        }
      }
    })
  }

  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
