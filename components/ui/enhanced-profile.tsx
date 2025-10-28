
'use client'

import { motion } from 'framer-motion'
import { Crown, Star, Trophy, Zap, Target, Shield, Gamepad2, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Card, CardContent, CardHeader } from './card'
import { Progress } from './progress'
import { LevelDisplay } from './level-display'
import { XPCounter } from './xp-counter'

interface ProfileBadge {
  id: string
  name: string
  description: string
  icon: any
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  level: number
  globalXP: number
  nextLevelXP: number
  currentLevelXP: number
  totalGamesPlayed: number
  totalWins: number
  badges: ProfileBadge[]
  joinedAt: Date
  lastSeen: Date
  rank: number
  totalPlayers: number
}

interface EnhancedProfileProps {
  user: UserProfile
  className?: string
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600', 
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
}

const rarityGlow = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50', 
  legendary: 'shadow-yellow-500/50'
}

export function EnhancedProfile({ user, className }: EnhancedProfileProps) {
  const winRate = user.totalGamesPlayed > 0 ? (user.totalWins / user.totalGamesPlayed) * 100 : 0
  const levelProgress = ((user.globalXP - user.currentLevelXP) / (user.nextLevelXP - user.currentLevelXP)) * 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-gaming-primary/5 via-background to-gaming-secondary/5 border-gaming-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-gaming-primary/5 to-gaming-secondary/5 opacity-50" />
          
          <CardHeader className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar with level ring */}
              <div className="relative">
                <motion.div
                  className="relative w-24 h-24 md:w-32 md:h-32"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Level ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      stroke="url(#levelGradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${levelProgress * 2.89} 289`}
                      className="filter drop-shadow-sm transition-all duration-1000 ease-in-out"
                      style={{
                        strokeDasharray: `${levelProgress * 2.89} 289`
                      }}
                    />
                    <defs>
                      <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(var(--gaming-primary))" />
                        <stop offset="100%" stopColor="rgb(var(--gaming-secondary))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <Avatar className="absolute inset-2 w-20 h-20 md:w-28 md:h-28 border-4 border-gaming-primary/50">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gaming-primary/20 text-gaming-primary font-bold text-xl md:text-2xl">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Level badge */}
                  <motion.div
                    className="absolute -bottom-2 -right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
                  >
                    <LevelDisplay level={user.level} xp={user.globalXP} size="lg" />
                  </motion.div>
                </motion.div>
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-orbitron font-bold gradient-text">
                      {user.username}
                    </h1>
                    {user.rank <= 10 && (
                      <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.7, type: "spring" }}
                      >
                        <Crown className="w-6 h-6 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>#{user.rank} von {user.totalPlayers.toLocaleString()}</span>
                    <span>•</span>
                    <span>Beigetreten: {new Date(user.joinedAt).toLocaleDateString('de-DE')}</span>
                    <span>•</span>
                    <span><XPCounter value={user.globalXP} /> XP</span>
                  </div>

                  {/* XP Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level {user.level} Progress</span>
                      <span className="text-gaming-primary font-medium">
                        {Math.round(levelProgress)}%
                      </span>
                    </div>
                    <Progress value={levelProgress} className="h-3 bg-muted" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{user.currentLevelXP.toLocaleString()} XP</span>
                      <span>{user.nextLevelXP.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    className="text-center p-3 rounded-lg bg-card border border-gaming-primary/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--gaming-primary), 0.1)" }}
                  >
                    <div className="text-2xl font-orbitron font-bold text-gaming-primary">
                      {user.totalGamesPlayed}
                    </div>
                    <div className="text-xs text-muted-foreground">Spiele</div>
                  </motion.div>
                  
                  <motion.div
                    className="text-center p-3 rounded-lg bg-card border border-gaming-secondary/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--gaming-secondary), 0.1)" }}
                  >
                    <div className="text-2xl font-orbitron font-bold text-gaming-secondary">
                      {user.totalWins}
                    </div>
                    <div className="text-xs text-muted-foreground">Siege</div>
                  </motion.div>
                  
                  <motion.div
                    className="text-center p-3 rounded-lg bg-card border border-gaming-accent/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--gaming-accent), 0.1)" }}
                  >
                    <div className="text-2xl font-orbitron font-bold text-gaming-accent">
                      {Math.round(winRate)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win-Rate</div>
                  </motion.div>
                  
                  <motion.div
                    className="text-center p-3 rounded-lg bg-card border border-purple-500/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(147, 51, 234, 0.1)" }}
                  >
                    <div className="text-2xl font-orbitron font-bold text-purple-400">
                      {user.badges.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <h2 className="text-xl font-orbitron font-bold flex items-center gap-2">
              <Medal className="w-5 h-5 text-gaming-primary" />
              Achievements & Badges
              <Badge variant="secondary" className="ml-auto">
                {user.badges.length}
              </Badge>
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {user.badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group cursor-pointer"
                >
                  <Card className={`relative overflow-hidden border-2 transition-all duration-300 hover:${rarityGlow[badge.rarity]} hover:border-opacity-80`}>
                    {/* Rarity background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[badge.rarity]} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    
                    <CardContent className="p-4 text-center relative z-10">
                      <motion.div
                        className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarityColors[badge.rarity]} flex items-center justify-center text-white shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <badge.icon className="w-6 h-6" />
                      </motion.div>
                      
                      <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                      
                      <Badge variant="outline" className={`text-xs bg-gradient-to-r ${rarityColors[badge.rarity]} text-white border-none`}>
                        {badge.rarity.toUpperCase()}
                      </Badge>
                      
                      {badge.progress !== undefined && badge.maxProgress && (
                        <div className="mt-2 space-y-1">
                          <Progress 
                            value={(badge.progress / badge.maxProgress) * 100} 
                            className="h-1.5"
                          />
                          <div className="text-xs text-muted-foreground">
                            {badge.progress}/{badge.maxProgress}
                          </div>
                        </div>
                      )}
                      
                      {badge.unlockedAt && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Freigeschaltet: {new Date(badge.unlockedAt).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Sample badges for demonstration
export const sampleBadges: ProfileBadge[] = [
  {
    id: 'first-win',
    name: 'Erste Sieg',
    description: 'Gewinne dein erstes Spiel',
    icon: Trophy,
    rarity: 'common',
    unlockedAt: new Date('2024-01-15')
  },
  {
    id: 'chess-master',
    name: 'Schach Meister',
    description: 'Gewinne 10 Schach-Partien',
    icon: Crown,
    rarity: 'rare',
    progress: 7,
    maxProgress: 10
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Gewinne ein Spiel in unter 60 Sekunden',
    icon: Zap,
    rarity: 'epic',
    unlockedAt: new Date('2024-02-20')
  },
  {
    id: 'legendary-player',
    name: 'Legendary Player',
    description: 'Erreiche Level 50',
    icon: Star,
    rarity: 'legendary',
    progress: 42,
    maxProgress: 50
  }
]
