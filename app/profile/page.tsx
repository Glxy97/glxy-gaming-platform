"use client"

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

type Badge = {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  obtainedAt?: Date
}

type Achievements = {
  achievementPoints: number
  achievementsUnlocked: number
  achievementsTotal: number
  latestAchievements?: string[]
}

type GameStats = {
  gamesPlayed: number
  gamesWon: number
  winRate: number
  averageScore: number
  highestScore: number
  favoriteGameMode: string
  playTimeHours: number
}

type SocialStats = {
  friendsCount: number
  followers: number
  following: number
  messagesSent: number
  groupsJoined: number
}

type InventoryItem = {
  id: string
  name: string
  type: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  icon?: string
  obtainedAt: Date
}

type EnhancedUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  username: string
  level: number
  xp: number
  nextLevelXp: number
  coins: number
  gems: number
  title: string
  bio?: string
  location?: string
  website?: string
  lastSeen: Date
  joinedAt: Date
  rank: number
  achievements: Achievements
  stats: GameStats
  social: SocialStats
  inventory: InventoryItem[]
  badges: Badge[]
  totalGames: number
  totalWins: number
  totalPlayers: number
}

function StatCard({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) {
  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur p-4 shadow-sm hover:shadow-md transition-all">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {subtext && <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-gaming-primary to-gaming-secondary" style={{ width: `${value}%` }} />
    </div>
  )
}

function BadgePill({ badge }: { badge: Badge }) {
  return (
    <div className="px-3 py-1 rounded-full text-xs border bg-background/60">
      {badge.name}
    </div>
  )
}

function InventoryItemCard({ item }: { item: InventoryItem }) {
  const rarityColors = {
    common: 'border-muted',
    uncommon: 'border-emerald-400/40',
    rare: 'border-blue-400/40',
    epic: 'border-purple-400/40',
    legendary: 'border-amber-400/40',
  } as const

  const ringColors = {
    common: 'ring-muted',
    uncommon: 'ring-emerald-400/40',
    rare: 'ring-blue-400/40',
    epic: 'ring-purple-400/40',
    legendary: 'ring-amber-400/40',
  } as const

  return (
    <div className={`rounded-xl border ${rarityColors[item.rarity]} p-3 bg-card/60 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ring-2 ${ringColors[item.rarity]} bg-muted/40`} />
        <div className="flex-1">
          <div className="text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{item.type} • {item.rarity}</div>
        </div>
      </div>
    </div>
  )
}

function EnhancedProfile({ user }: { user: EnhancedUser }) {
  const xpPercent = Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border bg-card/60 backdrop-blur p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl ring-4 ring-gaming-primary/30 bg-gradient-to-br from-gaming-primary/20 to-gaming-secondary/20" />
            <div className="absolute -bottom-2 -right-2 px-2 py-1 text-xs rounded-full bg-gaming-primary text-white">
              Lv. {user.level}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{user.name ?? user.username}</h1>
              <span className="text-xs px-2 py-1 rounded-full border bg-background/60">{user.title}</span>
            </div>
            {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP</span>
                <span>{user.xp} / {user.nextLevelXp} ({xpPercent}%)</span>
              </div>
              <ProgressBar value={xpPercent} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:w-[420px]">
            <StatCard title="Rang" value={`#${user.rank}`} subtext={`von ${user.totalPlayers.toLocaleString()} Spielern`} />
            <StatCard title="Siege" value={user.totalWins} subtext={`${user.totalGames} Spiele`} />
            <StatCard title="Erfolgspunkte" value={user.achievements.achievementPoints} />
            <StatCard title="Coins" value={user.coins.toLocaleString()} />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-3xl border bg-card/60 backdrop-blur p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Badges</h2>
          <div className="text-sm text-muted-foreground">{user.badges.length} gesammelt</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.badges.slice(0, 12).map((b) => <BadgePill key={b.id} badge={b} />)}
        </div>
      </div>

      {/* Stats + Social */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border bg-card/60 backdrop-blur p-6">
          <h2 className="text-lg font-semibold">Spielstatistiken</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard title="Gespielt" value={user.stats.gamesPlayed} />
            <StatCard title="Gewonnen" value={user.stats.gamesWon} />
            <StatCard title="Winrate" value={`${user.stats.winRate}%`} />
            <StatCard title="Avg. Score" value={user.stats.averageScore} />
            <StatCard title="Highest Score" value={user.stats.highestScore} />
            <StatCard title="Spielzeit" value={`${user.stats.playTimeHours}h`} />
          </div>
        </div>

        <div className="rounded-3xl border bg-card/60 backdrop-blur p-6">
          <h2 className="text-lg font-semibold">Soziales</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard title="Freunde" value={user.social.friendsCount} />
            <StatCard title="Follower" value={user.social.followers} />
            <StatCard title="Folge ich" value={user.social.following} />
            <StatCard title="Nachrichten" value={user.social.messagesSent} />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="rounded-3xl border bg-card/60 backdrop-blur p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inventar</h2>
          <div className="text-sm text-muted-foreground">{user.inventory.length} Items</div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {user.inventory.slice(0, 6).map((item) => <InventoryItemCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: profile } = useSWR(status === 'authenticated' ? '/api/profile' : null, fetcher)

  // Redirect to username setup if OAuth user without username
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if user needs username setup (OAuth users without username)
      if (!(session.user as any)?.username && (session.user as any)?.needsUsernameSetup) {
        router.push('/auth/setup-username')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Lade Profil..." />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Nicht eingeloggt.</div>
      </div>
    )
  }

  const u = profile?.user || {}
  const userData: EnhancedUser = {
    id: u.id || session.user?.id || 'u',
    name: u.name ?? session.user?.name ?? null,
    email: u.email ?? session.user?.email ?? null,
    image: u.image ?? session.user?.image ?? null,
    username: u.username ?? (session.user as any)?.username ?? 'player',
    level: u.level ?? (session.user as any)?.level ?? 1,
    xp: (session.user as any)?.globalXP ?? 0,
    nextLevelXp: ((session.user as any)?.globalXP ?? 0) + 1000, // naive placeholder progression
    coins: 0,
    gems: 0,
    title: 'Player',
    bio: undefined,
    location: undefined,
    website: undefined,
    lastSeen: u.lastLogin ? new Date(u.lastLogin) : new Date(),
    joinedAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    rank: 0,
    achievements: {
      achievementPoints: 0,
      achievementsUnlocked: 0,
      achievementsTotal: 0,
      latestAchievements: [],
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      averageScore: 0,
      highestScore: 0,
      favoriteGameMode: '—',
      playTimeHours: 0,
    },
    social: {
      friendsCount: 0,
      followers: 0,
      following: 0,
      messagesSent: 0,
      groupsJoined: 0,
    },
    inventory: [],
    badges: [],
    totalGames: 0,
    totalWins: 0,
    totalPlayers: 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gaming-primary/5 to-gaming-secondary/5 p-4">
      <div className="max-w-6xl mx-auto">
        <EnhancedProfile user={userData} />
      </div>
    </div>
  )
}
