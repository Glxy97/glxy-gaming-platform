// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface FriendRequest {
  requestId: string
  senderId: string
  senderUsername: string
  senderLevel: number
  senderRank: string
  message: string
  timestamp: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export interface Friend {
  playerId: string
  username: string
  level: number
  rank: string
  status: 'online' | 'offline' | 'in_game' | 'away' | 'busy'
  currentActivity?: {
    gameMode: string
    mapId: string
    timeInGame: number
  }
  lastSeen: Date
  isFavorite: boolean
  notes: string
  playtimeTogether: number
  gamesPlayedTogether: number
  winsTogether: number
  mutualClans: string[]
  achievements: string[]
}

export interface VoiceChatChannel {
  channelId: string
  name: string
  type: 'public' | 'private' | 'clan' | 'party' | 'game'
  participants: VoiceChatParticipant[]
  maxParticipants: number
  isLocked: boolean
  password?: string
  createdBy: string
  createdAt: Date
  settings: {
    pushToTalk: boolean
    spatialAudio: boolean
    noiseSuppression: boolean
    echoCancellation: boolean
    autoGain: boolean
  }
}

export interface VoiceChatParticipant {
  userId: string
  username: string
  isSpeaking: boolean
  isMuted: boolean
  isDeafened: boolean
  volume: number
  audioLevel: number
  joinTime: Date
  role: 'host' | 'moderator' | 'participant'
}

export interface Party {
  partyId: string
  leaderId: string
  members: PartyMember[]
  maxSize: number
  isPrivate: boolean
  inviteCode?: string
  gameMode?: string
  status: 'waiting' | 'in_queue' | 'in_match' | 'disbanded'
  createdAt: Date
  settings: {
    allowInvites: boolean
    autoFill: boolean
    skillMatching: boolean
    crossplay: boolean
  }
}

export interface PartyMember {
  userId: string
  username: string
  level: number
  rank: string
  role: 'leader' | 'member'
  ready: boolean
  connected: boolean
  joinTime: Date
  status: 'online' | 'offline' | 'away'
}

export interface SocialStats {
  totalFriends: number
  onlineFriends: number
  friendsInGame: number
  pendingRequests: number
  blockedUsers: number
  partiesJoined: number
  voiceChatTime: number
  messagesSent: number
  giftsGiven: number
  giftsReceived: number
}

export interface SocialSettings {
  allowFriendRequests: boolean
  showOnlineStatus: boolean
  allowPartyInvites: boolean
  autoJoinParty: boolean
  voiceChatEnabled: boolean
  pushToTalk: boolean
  notifications: {
    friendOnline: boolean
    friendOffline: boolean
    partyInvite: boolean
    gameInvite: boolean
    message: boolean
    achievement: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private'
    gameVisibility: 'public' | 'friends' | 'private'
    allowDirectMessages: boolean
  }
}

export const GLXY_SOCIAL_SETTINGS = {
  // Default settings
  DEFAULT_SETTINGS: {
    allowFriendRequests: true,
    showOnlineStatus: true,
    allowPartyInvites: true,
    autoJoinParty: false,
    voiceChatEnabled: true,
    pushToTalk: false,
    notifications: {
      friendOnline: true,
      friendOffline: true,
      partyInvite: true,
      gameInvite: true,
      message: true,
      achievement: true
    },
    privacy: {
      profileVisibility: 'public' as const,
      gameVisibility: 'public' as const,
      allowDirectMessages: true
    }
  } as SocialSettings,

  // Limits
  MAX_FRIENDS: 200,
  MAX_BLOCKED_USERS: 100,
  MAX_PARTY_SIZE: 8,
  MAX_VOICE_CHANNELS: 50,
  MAX_PARTICIPANTS_PER_CHANNEL: 20,

  // Voice chat settings
  VOICE_SAMPLE_RATE: 48000,
  VOICE_BITRATE: 64000,
  VOICE_CHANNELS: 1,
  AUDIO_BUFFER_SIZE: 4096,
  SILENCE_THRESHOLD: 0.01,
  MAX_AUDIO_LEVEL: 1.0,

  // Party settings
  PARTY_INVITE_EXPIRE_TIME: 300000, // 5 minutes
  PARTY_AUTO_DISBAND_TIME: 300000, // 5 minutes after last member leaves
  PARTY_READY_TIMEOUT: 60000, // 1 minute

  // Friend request settings
  FRIEND_REQUEST_EXPIRE_TIME: 604800000, // 7 days
  MAX_PENDING_REQUESTS: 20,
  FRIEND_REQUEST_COOLDOWN: 60000 // 1 minute between requests
}

export class SocialSystem {
  private currentUserId: string
  private settings: SocialSettings
  private friends: Map<string, Friend>
  private friendRequests: Map<string, FriendRequest>
  private blockedUsers: Set<string>
  private parties: Map<string, Party>
  private currentParty: Party | null
  private voiceChannels: Map<string, VoiceChatChannel>
  private currentVoiceChannel: VoiceChatChannel | null
  private socialStats!: SocialStats
  private audioContext!: AudioContext | null
  private mediaStream!: MediaStream | null
  private voiceChatActive!: boolean

  constructor(userId: string) {
    this.currentUserId = userId
    this.settings = { ...GLXY_SOCIAL_SETTINGS.DEFAULT_SETTINGS }
    this.friends = new Map()
    this.friendRequests = new Map()
    this.blockedUsers = new Set()
    this.parties = new Map()
    this.currentParty = null
    this.voiceChannels = new Map()
    this.currentVoiceChannel = null
    this.voiceChatActive = false

    this.socialStats = {
      totalFriends: 0,
      onlineFriends: 0,
      friendsInGame: 0,
      pendingRequests: 0,
      blockedUsers: 0,
      partiesJoined: 0,
      voiceChatTime: 0,
      messagesSent: 0,
      giftsGiven: 0,
      giftsReceived: 0
    }

    this.initializeSystem()
  }

  private initializeSystem() {
    this.loadSocialData()
    this.setupVoiceChat()
    this.startSocialMonitoring()
    console.log('👥 GLXY Social System initialized')
  }

  private loadSocialData() {
    // Simulate loading social data
    this.generateMockFriends()
    this.generateMockFriendRequests()
    this.generateMockParties()
    this.generateMockVoiceChannels()
  }

  private generateMockFriends() {
    const mockFriends = [
      { username: 'ProSniper42', level: 85, rank: 'Diamond', status: 'online' as const },
      { username: 'RushMaster', level: 72, rank: 'Platinum', status: 'in_game' as const },
      { username: 'TacticalAce', level: 91, rank: 'Master', status: 'away' as const },
      { username: 'ShadowOps', level: 68, rank: 'Gold', status: 'online' as const },
      { username: 'HeadshotKing', level: 77, rank: 'Diamond', status: 'offline' as const },
      { username: 'QuickScope', level: 64, rank: 'Platinum', status: 'in_game' as const },
      { username: 'StealthNinja', level: 83, rank: 'Master', status: 'online' as const },
      { username: 'CombatVet', level: 95, rank: 'Grandmaster', status: 'busy' as const }
    ]

    mockFriends.forEach(friend => {
      const friendObj: Friend = {
        playerId: 'player_' + Math.random().toString(36).substr(2, 9),
        username: friend.username,
        level: friend.level,
        rank: friend.rank,
        status: friend.status,
        lastSeen: new Date(),
        isFavorite: Math.random() > 0.7,
        notes: '',
        playtimeTogether: Math.floor(Math.random() * 500) + 50,
        gamesPlayedTogether: Math.floor(Math.random() * 200) + 20,
        winsTogether: Math.floor(Math.random() * 100) + 10,
        mutualClans: [],
        achievements: []
      }

      if (friend.status === 'in_game') {
        friendObj.currentActivity = {
          gameMode: ['Team Deathmatch', 'Domination', 'Search & Destroy'][Math.floor(Math.random() * 3)],
          mapId: ['Dust2', 'Mirage', 'Inferno'][Math.floor(Math.random() * 3)],
          timeInGame: Math.floor(Math.random() * 3600) + 300
        }
      }

      this.friends.set(friendObj.playerId, friendObj)
    })

    this.updateSocialStats()
  }

  private generateMockFriendRequests() {
    const mockRequests = [
      { username: 'NewPlayer99', level: 12, rank: 'Bronze', message: 'Hey, want to play together?' },
      { username: 'SniperElite', level: 45, rank: 'Gold', message: 'Good teamwork in the last match!' },
      { username: 'RookieRusher', level: 28, rank: 'Silver', message: 'Add me for ranked matches' }
    ]

    mockRequests.forEach((req, index) => {
      const request: FriendRequest = {
        requestId: 'req_' + Date.now() + '_' + index,
        senderId: 'player_' + Math.random().toString(36).substr(2, 9),
        senderUsername: req.username,
        senderLevel: req.level,
        senderRank: req.rank,
        message: req.message,
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
        status: 'pending'
      }

      this.friendRequests.set(request.requestId, request)
    })
  }

  private generateMockParties() {
    const party: Party = {
      partyId: 'party_' + Math.random().toString(36).substr(2, 9),
      leaderId: this.currentUserId,
      members: [{
        userId: this.currentUserId,
        username: 'You',
        level: 75,
        rank: 'Diamond',
        role: 'leader',
        ready: true,
        connected: true,
        joinTime: new Date(),
        status: 'online'
      }],
      maxSize: 4,
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date(),
      settings: {
        allowInvites: true,
        autoFill: true,
        skillMatching: true,
        crossplay: true
      }
    }

    this.parties.set(party.partyId, party)
    this.currentParty = party
  }

  private generateMockVoiceChannels() {
    const channels: VoiceChatChannel[] = [
      {
        channelId: 'global',
        name: 'Global Chat',
        type: 'public',
        participants: [],
        maxParticipants: 50,
        isLocked: false,
        createdBy: 'system',
        createdAt: new Date(),
        settings: {
          pushToTalk: false,
          spatialAudio: false,
          noiseSuppression: true,
          echoCancellation: true,
          autoGain: true
        }
      },
      {
        channelId: 'party',
        name: 'Party Voice',
        type: 'party',
        participants: [],
        maxParticipants: 8,
        isLocked: false,
        createdBy: this.currentUserId,
        createdAt: new Date(),
        settings: {
          pushToTalk: false,
          spatialAudio: true,
          noiseSuppression: true,
          echoCancellation: true,
          autoGain: true
        }
      },
      {
        channelId: 'tactics',
        name: 'Tactics Discussion',
        type: 'public',
        participants: [],
        maxParticipants: 20,
        isLocked: false,
        createdBy: 'system',
        createdAt: new Date(),
        settings: {
          pushToTalk: true,
          spatialAudio: false,
          noiseSuppression: true,
          echoCancellation: true,
          autoGain: false
        }
      }
    ]

    channels.forEach(channel => {
      this.voiceChannels.set(channel.channelId, channel)
    })
  }

  // FRIEND SYSTEM
  public async sendFriendRequest(playerId: string, message: string = ''): Promise<boolean> {
    if (!this.settings.allowFriendRequests) {
      console.log('Friend requests are disabled')
      return false
    }

    if (this.friends.has(playerId)) {
      console.log('Player is already a friend')
      return false
    }

    try {
      // In a real implementation, this would send a request to the server
      const request: FriendRequest = {
        requestId: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        senderId: this.currentUserId,
        senderUsername: 'You',
        senderLevel: 75,
        senderRank: 'Diamond',
        message,
        timestamp: new Date(),
        status: 'pending'
      }

      console.log(`📨 Sent friend request to ${playerId}`)
      return true
    } catch (error) {
      console.error('Failed to send friend request:', error)
      return false
    }
  }

  public async acceptFriendRequest(requestId: string): Promise<boolean> {
    const request = this.friendRequests.get(requestId)
    if (!request || request.status !== 'pending') {
      return false
    }

    try {
      // Create friend
      const friend: Friend = {
        playerId: request.senderId,
        username: request.senderUsername,
        level: request.senderLevel,
        rank: request.senderRank,
        status: 'online',
        lastSeen: new Date(),
        isFavorite: false,
        notes: request.message,
        playtimeTogether: 0,
        gamesPlayedTogether: 0,
        winsTogether: 0,
        mutualClans: [],
        achievements: []
      }

      this.friends.set(request.senderId, friend)
      request.status = 'accepted'

      this.updateSocialStats()
      console.log(`✅ Accepted friend request from ${request.senderUsername}`)
      return true
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      return false
    }
  }

  public async declineFriendRequest(requestId: string): Promise<boolean> {
    const request = this.friendRequests.get(requestId)
    if (!request || request.status !== 'pending') {
      return false
    }

    request.status = 'declined'
    console.log(`❌ Declined friend request from ${request.senderUsername}`)
    return true
  }

  public async removeFriend(playerId: string): Promise<boolean> {
    const friend = this.friends.get(playerId)
    if (!friend) return false

    this.friends.delete(playerId)
    this.updateSocialStats()
    console.log(`🗑️ Removed friend: ${friend.username}`)
    return true
  }

  public async blockUser(playerId: string): Promise<boolean> {
    // Remove from friends if exists
    if (this.friends.has(playerId)) {
      this.friends.delete(playerId)
    }

    // Add to blocked list
    this.blockedUsers.add(playerId)
    this.updateSocialStats()
    console.log(`🚫 Blocked user: ${playerId}`)
    return true
  }

  public async unblockUser(playerId: string): Promise<boolean> {
    if (!this.blockedUsers.has(playerId)) return false

    this.blockedUsers.delete(playerId)
    this.updateSocialStats()
    console.log(`✅ Unblocked user: ${playerId}`)
    return true
  }

  // PARTY SYSTEM
  public createParty(isPrivate: boolean = false): Party {
    const party: Party = {
      partyId: 'party_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      leaderId: this.currentUserId,
      members: [{
        userId: this.currentUserId,
        username: 'You',
        level: 75,
        rank: 'Diamond',
        role: 'leader',
        ready: true,
        connected: true,
        joinTime: new Date(),
        status: 'online'
      }],
      maxSize: GLXY_SOCIAL_SETTINGS.MAX_PARTY_SIZE,
      isPrivate,
      status: 'waiting',
      createdAt: new Date(),
      settings: {
        allowInvites: true,
        autoFill: !isPrivate,
        skillMatching: true,
        crossplay: true
      }
    }

    if (isPrivate) {
      party.inviteCode = this.generateInviteCode()
    }

    this.parties.set(party.partyId, party)
    this.currentParty = party

    console.log(`🎉 Created party: ${party.partyId}`)
    return party
  }

  public async inviteToParty(playerId: string): Promise<boolean> {
    if (!this.currentParty) {
      console.log('No active party')
      return false
    }

    if (this.currentParty.members.length >= this.currentParty.maxSize) {
      console.log('Party is full')
      return false
    }

    if (!this.currentParty.settings.allowInvites) {
      console.log('Party invites are disabled')
      return false
    }

    try {
      // In a real implementation, this would send an invite to the player
      console.log(`📨 Sent party invite to ${playerId}`)
      return true
    } catch (error) {
      console.error('Failed to send party invite:', error)
      return false
    }
  }

  public async joinParty(partyId: string, inviteCode?: string): Promise<boolean> {
    const party = this.parties.get(partyId)
    if (!party) {
      console.log('Party not found')
      return false
    }

    if (party.isPrivate && party.inviteCode !== inviteCode) {
      console.log('Invalid invite code')
      return false
    }

    if (party.members.length >= party.maxSize) {
      console.log('Party is full')
      return false
    }

    // Add player to party
    const member: PartyMember = {
      userId: this.currentUserId,
      username: 'You',
      level: 75,
      rank: 'Diamond',
      role: 'member',
      ready: false,
      connected: true,
      joinTime: new Date(),
      status: 'online'
    }

    party.members.push(member)
    this.currentParty = party

    console.log(`✅ Joined party: ${partyId}`)
    return true
  }

  public async leaveParty(): Promise<boolean> {
    if (!this.currentParty) return false

    // Remove player from party
    this.currentParty.members = this.currentParty.members.filter(
      m => m.userId !== this.currentUserId
    )

    // Transfer leadership if player was leader
    if (this.currentParty.leaderId === this.currentUserId && this.currentParty.members.length > 0) {
      this.currentParty.leaderId = this.currentParty.members[0].userId
      this.currentParty.members[0].role = 'leader'
    }

    // Disband party if empty
    if (this.currentParty.members.length === 0) {
      this.parties.delete(this.currentParty.partyId)
    }

    this.currentParty = null
    console.log('🚪 Left party')
    return true
  }

  public async kickFromParty(playerId: string): Promise<boolean> {
    if (!this.currentParty || this.currentParty.leaderId !== this.currentUserId) {
      console.log('Not party leader')
      return false
    }

    const memberIndex = this.currentParty.members.findIndex(m => m.userId === playerId)
    if (memberIndex === -1) {
      console.log('Player not in party')
      return false
    }

    const kickedMember = this.currentParty.members[memberIndex]
    this.currentParty.members.splice(memberIndex, 1)

    console.log(`👢 Kicked ${kickedMember.username} from party`)
    return true
  }

  public async setPartyReady(): Promise<boolean> {
    if (!this.currentParty) return false

    const member = this.currentParty.members.find(m => m.userId === this.currentUserId)
    if (!member) return false

    member.ready = !member.ready
    console.log(`✅ Party ready status: ${member.ready}`)
    return true
  }

  // VOICE CHAT SYSTEM
  private async setupVoiceChat() {
    if (!this.settings.voiceChatEnabled) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: GLXY_SOCIAL_SETTINGS.VOICE_SAMPLE_RATE,
          channelCount: GLXY_SOCIAL_SETTINGS.VOICE_CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('🎤 Voice chat initialized')
    } catch (error) {
      console.error('Failed to initialize voice chat:', error)
    }
  }

  public async joinVoiceChannel(channelId: string): Promise<boolean> {
    const channel = this.voiceChannels.get(channelId)
    if (!channel) {
      console.log('Voice channel not found')
      return false
    }

    if (channel.participants.length >= channel.maxParticipants) {
      console.log('Voice channel is full')
      return false
    }

    if (!this.mediaStream) {
      await this.setupVoiceChat()
      if (!this.mediaStream) return false
    }

    // Add participant to channel
    const participant: VoiceChatParticipant = {
      userId: this.currentUserId,
      username: 'You',
      isSpeaking: false,
      isMuted: false,
      isDeafened: false,
      volume: 1.0,
      audioLevel: 0,
      joinTime: new Date(),
      role: this.currentParty?.leaderId === this.currentUserId ? 'host' : 'participant'
    }

    channel.participants.push(participant)
    this.currentVoiceChannel = channel
    this.voiceChatActive = true

    console.log(`🎤 Joined voice channel: ${channel.name}`)
    return true
  }

  public async leaveVoiceChannel(): Promise<boolean> {
    if (!this.currentVoiceChannel) return false

    // Remove participant from channel
    this.currentVoiceChannel.participants = this.currentVoiceChannel.participants.filter(
      p => p.userId !== this.currentUserId
    )

    this.currentVoiceChannel = null
    this.voiceChatActive = false

    console.log('🔇 Left voice channel')
    return true
  }

  public toggleMute(): boolean {
    if (!this.currentVoiceChannel) return false

    const participant = this.currentVoiceChannel.participants.find(p => p.userId === this.currentUserId)
    if (!participant) return false

    participant.isMuted = !participant.isMuted

    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !participant.isMuted
      })
    }

    console.log(`🔇 Microphone ${participant.isMuted ? 'muted' : 'unmuted'}`)
    return participant.isMuted
  }

  public toggleDeafen(): boolean {
    if (!this.currentVoiceChannel) return false

    const participant = this.currentVoiceChannel.participants.find(p => p.userId === this.currentUserId)
    if (!participant) return false

    participant.isDeafened = !participant.isDeafened

    // In a real implementation, this would mute all incoming audio
    console.log(`🎧 Headset ${participant.isDeafened ? 'deafened' : 'undeafened'}`)
    return participant.isDeafened
  }

  // UTILITY METHODS
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  private updateSocialStats() {
    let onlineFriends = 0
    let friendsInGame = 0

    this.friends.forEach(friend => {
      if (friend.status === 'online') onlineFriends++
      if (friend.status === 'in_game') friendsInGame++
    })

    this.socialStats = {
      totalFriends: this.friends.size,
      onlineFriends,
      friendsInGame,
      pendingRequests: Array.from(this.friendRequests.values()).filter(r => r.status === 'pending').length,
      blockedUsers: this.blockedUsers.size,
      partiesJoined: this.parties.size,
      voiceChatTime: this.voiceChatActive ? this.socialStats.voiceChatTime + 1 : this.socialStats.voiceChatTime,
      messagesSent: this.socialStats.messagesSent,
      giftsGiven: this.socialStats.giftsGiven,
      giftsReceived: this.socialStats.giftsReceived
    }
  }

  private startSocialMonitoring() {
    setInterval(() => {
      // Simulate friend status changes
      if (Math.random() < 0.1) { // 10% chance every interval
        this.updateRandomFriendStatus()
      }

      // Update stats
      this.updateSocialStats()
    }, 30000) // Every 30 seconds
  }

  private updateRandomFriendStatus() {
    if (this.friends.size === 0) return

    const friendIds = Array.from(this.friends.keys())
    const randomFriendId = friendIds[Math.floor(Math.random() * friendIds.length)]
    const friend = this.friends.get(randomFriendId)

    if (!friend) return

    const statuses: Friend['status'][] = ['online', 'offline', 'in_game', 'away', 'busy']
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)]

    friend.status = newStatus
    friend.lastSeen = new Date()

    if (newStatus === 'in_game') {
      friend.currentActivity = {
        gameMode: ['Team Deathmatch', 'Domination', 'Search & Destroy'][Math.floor(Math.random() * 3)],
        mapId: ['Dust2', 'Mirage', 'Inferno'][Math.floor(Math.random() * 3)],
        timeInGame: Math.floor(Math.random() * 3600) + 300
      }
    } else {
      delete friend.currentActivity
    }

    console.log(`🔄 ${friend.username} status updated to: ${newStatus}`)
  }

  // GETTERS
  public getFriends(): Friend[] {
    return Array.from(this.friends.values())
  }

  public getFriendRequests(): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter(r => r.status === 'pending')
  }

  public getCurrentParty(): Party | null {
    return this.currentParty
  }

  public getVoiceChannels(): VoiceChatChannel[] {
    return Array.from(this.voiceChannels.values())
  }

  public getCurrentVoiceChannel(): VoiceChatChannel | null {
    return this.currentVoiceChannel
  }

  public getSocialStats(): SocialStats {
    return { ...this.socialStats }
  }

  public getSettings(): SocialSettings {
    return { ...this.settings }
  }

  public updateSettings(newSettings: Partial<SocialSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    console.log('⚙️ Updated social settings')
  }

  // CLEANUP
  public destroy() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    console.log('🧹 GLXY Social System destroyed')
  }
}

// React components for Social UI
export const SocialHub: React.FC<{
  socialSystem: SocialSystem
  onInviteFriend: (friendId: string) => void
  onJoinGame: (friendId: string) => void
}> = ({ socialSystem, onInviteFriend, onJoinGame }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'party' | 'voice' | 'requests'>('friends')
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const friends = socialSystem.getFriends()
  const friendRequests = socialSystem.getFriendRequests()
  const currentParty = socialSystem.getCurrentParty()
  const voiceChannels = socialSystem.getVoiceChannels()
  const currentVoiceChannel = socialSystem.getCurrentVoiceChannel()
  const stats = socialSystem.getSocialStats()

  return (
    <div className="social-hub">
      <Card className="bg-gray-900 border-blue-500 border-2">
        <CardHeader>
          <CardTitle className="text-blue-400 text-xl flex items-center justify-between">
            <span>👥 GLXY SOCIAL HUB</span>
            <div className="flex space-x-2 text-sm">
              <Badge className="bg-green-600">{stats.onlineFriends} Online</Badge>
              <Badge className="bg-blue-600">{stats.totalFriends} Friends</Badge>
              {currentParty && <Badge className="bg-purple-600">Party ({currentParty.members.length})</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'friends' ? 'default' : 'outline'}
              onClick={() => setActiveTab('friends')}
              className={activeTab === 'friends' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300'}
            >
              Friends ({stats.pendingRequests > 0 && `+${stats.pendingRequests}`})
            </Button>
            <Button
              variant={activeTab === 'party' ? 'default' : 'outline'}
              onClick={() => setActiveTab('party')}
              className={activeTab === 'party' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300'}
            >
              Party
            </Button>
            <Button
              variant={activeTab === 'voice' ? 'default' : 'outline'}
              onClick={() => setActiveTab('voice')}
              className={activeTab === 'voice' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600 text-gray-300'}
            >
              Voice Chat
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'default' : 'outline'}
              onClick={() => setActiveTab('requests')}
              className={activeTab === 'requests' ? 'bg-orange-600 hover:bg-orange-700' : 'border-gray-600 text-gray-300'}
            >
              Requests ({stats.pendingRequests})
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'friends' && (
            <div className="friends-list">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-300">Friends List</h3>
                <Button
                  onClick={() => setShowInviteDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  Add Friend
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {friends.map(friend => (
                  <div key={friend.playerId} className="friend-item bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        friend.status === 'online' ? 'bg-green-500' :
                        friend.status === 'in_game' ? 'bg-yellow-500' :
                        friend.status === 'away' ? 'bg-orange-500' :
                        friend.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-medium text-white">
                          {friend.username} {friend.isFavorite && '⭐'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Level {friend.level} • {friend.rank} • {friend.status.replace('_', ' ')}
                        </div>
                        {friend.currentActivity && (
                          <div className="text-xs text-blue-400">
                            Playing {friend.currentActivity.gameMode} on {friend.currentActivity.mapId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {friend.status === 'in_game' && (
                        <Button
                          onClick={() => onJoinGame(friend.playerId)}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          Join
                        </Button>
                      )}
                      <Button
                        onClick={() => onInviteFriend(friend.playerId)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        Invite
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'party' && (
            <div className="party-section">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Party</h3>

              {currentParty ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="font-medium text-white">
                        Party Leader: {currentParty.members.find(m => m.role === 'leader')?.username}
                      </div>
                      <div className="text-sm text-gray-400">
                        {currentParty.members.length}/{currentParty.maxSize} Players
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => socialSystem.setPartyReady()}
                        className="bg-green-600 hover:bg-green-700 text-sm"
                      >
                        Ready
                      </Button>
                      <Button
                        onClick={() => socialSystem.leaveParty()}
                        className="bg-red-600 hover:bg-red-700 text-sm"
                      >
                        Leave
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentParty.members.map(member => (
                      <div key={member.userId} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            member.ready ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-white">{member.username}</span>
                          {member.role === 'leader' && <Badge className="bg-purple-600 text-xs">LEADER</Badge>}
                        </div>
                        <div className="text-sm text-gray-400">
                          Level {member.level} • {member.rank}
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentParty.inviteCode && (
                    <div className="mt-4 p-2 bg-gray-700 rounded text-center">
                      <div className="text-xs text-gray-400">Invite Code</div>
                      <div className="font-mono text-green-400">{currentParty.inviteCode}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <h4 className="text-lg font-semibold text-purple-300 mb-2">No Active Party</h4>
                  <p className="text-gray-400 mb-4">Create or join a party to play with friends</p>
                  <Button
                    onClick={() => socialSystem.createParty()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Party
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="voice-chat-section">
              <h3 className="text-lg font-semibold text-green-300 mb-4">Voice Chat</h3>

              <div className="space-y-3">
                {voiceChannels.map(channel => (
                  <div key={channel.channelId} className="voice-channel bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          channel.type === 'party' ? 'bg-purple-500' :
                          channel.type === 'public' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium text-white">{channel.name}</span>
                        <Badge className="bg-gray-600 text-xs">
                          {channel.participants.length}/{channel.maxParticipants}
                        </Badge>
                      </div>
                      {currentVoiceChannel?.channelId === channel.channelId ? (
                        <Button
                          onClick={() => socialSystem.leaveVoiceChannel()}
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          Leave
                        </Button>
                      ) : (
                        <Button
                          onClick={() => socialSystem.joinVoiceChannel(channel.channelId)}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                          disabled={channel.participants.length >= channel.maxParticipants}
                        >
                          Join
                        </Button>
                      )}
                    </div>

                    {currentVoiceChannel?.channelId === channel.channelId && (
                      <div className="flex space-x-2 mt-2">
                        <Button
                          onClick={() => socialSystem.toggleMute()}
                          className="bg-gray-700 hover:bg-gray-600 text-xs"
                        >
                          🎤 Mute
                        </Button>
                        <Button
                          onClick={() => socialSystem.toggleDeafen()}
                          className="bg-gray-700 hover:bg-gray-600 text-xs"
                        >
                          🎧 Deafen
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="friend-requests">
              <h3 className="text-lg font-semibold text-orange-300 mb-4">Friend Requests</h3>

              {friendRequests.length > 0 ? (
                <div className="space-y-2">
                  {friendRequests.map(request => (
                    <div key={request.requestId} className="friend-request bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-white">{request.senderUsername}</div>
                          <div className="text-sm text-gray-400">
                            Level {request.senderLevel} • {request.senderRank}
                          </div>
                          {request.message && (
                            <div className="text-sm text-gray-300 mt-1">"{request.message}"</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => socialSystem.acceptFriendRequest(request.requestId)}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => socialSystem.declineFriendRequest(request.requestId)}
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">📭</div>
                  <p>No pending friend requests</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Friend Dialog */}
      {showInviteDialog && (
        <InviteFriendDialog
          onClose={() => setShowInviteDialog(false)}
          onInvite={(username) => {
            socialSystem.sendFriendRequest(username, 'Let\'s play together!')
            setShowInviteDialog(false)
          }}
        />
      )}

      <style jsx>{`
        .social-hub {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 400px;
          max-height: 80vh;
          z-index: 1000;
          pointer-events: auto;
        }

        .friend-item {
          transition: background-color 0.2s;
        }

        .friend-item:hover {
          background-color: rgba(255, 107, 0, 0.1);
        }

        .voice-channel {
          transition: border-color 0.2s;
        }

        .voice-channel:hover {
          border-color: #10b981;
        }
      `}</style>
    </div>
  )
}

const InviteFriendDialog: React.FC<{
  onClose: () => void
  onInvite: (username: string) => void
}> = ({ onClose, onInvite }) => {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="bg-gray-900 border-blue-500 border-2 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-blue-400 text-xl">Invite Friend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Add a personal message..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => onInvite(username)}
              disabled={!username}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              Send Invite
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SocialSystem