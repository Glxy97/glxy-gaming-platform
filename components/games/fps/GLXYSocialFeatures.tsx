// @ts-nocheck
/**
 * GLXY Social Features - Phase 2 Implementation
 * Voice Chat, Team System, Replay System with Camera Controls, and Social Feed
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  Users,
  MessageSquare,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Share2,
  Heart,
  Bookmark,
  Camera,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Upload,
  Edit3,
  Trash2,
  Star,
  Award,
  Trophy,
  Crown,
  Shield,
  Target,
  Clock,
  Eye,
  EyeOff,
  Repeat,
  Shuffle,
  Wifi,
  WifiOff,
  UserPlus,
  UserMinus,
  Flag,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Gamepad2,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

// Friend System
export interface Friend {
  id: string
  userId: string
  username: string
  displayName: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'busy' | 'ingame'
  currentActivity?: string
  lastSeen: Date
  friendSince: Date
  isFavorite: boolean
  isBlocked: boolean
  mutualFriends: number
  level: number
  rank: string
  stats: PlayerStats
  achievements: string[]
}

export interface PlayerStats {
  wins: number
  losses: number
  kd: number
  accuracy: number
  playtime: number // hours
  favoriteMode: string
  recentMatches: number[]
}

export interface FriendRequest {
  id: string
  fromUser: string
  toUser: string
  status: 'pending' | 'accepted' | 'declined'
  message: string
  timestamp: Date
}

// Team/Party System
export interface Party {
  id: string
  name: string
  leaderId: string
  members: PartyMember[]
  maxMembers: number
  isPrivate: boolean
  inviteCode?: string
  password?: string
  description: string
  tags: string[]
  createdAt: Date
  lastActivity: Date
  isPlaying: boolean
  currentGame?: string
  voiceChat: PartyVoiceChat
  settings: PartySettings
}

export interface PartyMember {
  userId: string
  username: string
  displayName: string
  avatar?: string
  role: 'leader' | 'member'
  status: 'connected' | 'disconnected' | 'ready' | 'not_ready'
  joinTime: Date
  isMuted: boolean
  isDeafened: boolean
  volume: number
  ping: number
  platform: 'pc' | 'mobile' | 'console'
}

export interface PartyVoiceChat {
  enabled: boolean
  quality: 'low' | 'medium' | 'high' | 'ultra'
  pushToTalk: boolean
  audioEffects: boolean
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  spatialAudio: boolean
}

export interface PartySettings {
  allowInvites: boolean
  autoAcceptFriends: boolean
  voiceChatRequired: boolean
  crossPlatform: boolean
  kickLeaderPermission: boolean
  disbandOnLeaderLeave: boolean
}

// Voice Chat System
export interface VoiceChatSystem {
  isEnabled: boolean
  inputDevice: MediaDeviceInfo | null
  outputDevice: MediaDeviceInfo | null
  audioContext: AudioContext
  localStream: MediaStream | null
  peerConnections: Map<string, RTCPeerConnection>
  remoteStreams: Map<string, MediaStream>
  participants: Map<string, VoiceParticipant>
  volume: Map<string, number>
  isMuted: boolean
  isDeafened: boolean
  isRecording: boolean
  audioLevel: number
  settings: VoiceChatSettings
}

export interface VoiceParticipant {
  id: string
  stream: MediaStream
  audioElement: HTMLAudioElement
  volume: number
  isMuted: boolean
  isSpeaking: boolean
  audioLevel: number
  ping: number
}

export interface VoiceChatSettings {
  inputGain: number
  outputGain: number
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  vadEnabled: boolean
  vadThreshold: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
  spatialAudio: boolean
  maxDistance: number
}

// Replay System
export interface ReplaySystem {
  isRecording: boolean
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  currentReplay: Replay | null
  replays: Replay[]
  settings: ReplaySettings
  controls: ReplayControls
  recordingData: RecordingData
}

export interface Replay {
  id: string
  name: string
  description: string
  gameId: string
  matchId: string
  map: string
  mode: string
  duration: number // seconds
  fileSize: number // bytes
  date: Date
  players: ReplayPlayer[]
  events: ReplayEvent[]
  highlights: ReplayHighlight[]
  tags: string[]
  isPublic: boolean
  isFavorite: boolean
  views: number
  likes: number
  downloads: number
  recordingData: RecordingData
  thumbnail?: string
}

export interface ReplayPlayer {
  userId: string
  username: string
  displayName: string
  team: string
  isLocalPlayer: boolean
  perspective: CameraPerspective
  position: Vector3Keyframe[]
  rotation: Vector3Keyframe[]
  actions: PlayerAction[]
  stats: PlayerReplayStats
}

export interface CameraPerspective {
  type: 'first_person' | 'third_person' | 'free' | 'cinematic' | 'spectator' | 'player'
  target?: string
  position: THREE.Vector3
  rotation: THREE.Euler
  fov: number
}

export interface Vector3Keyframe {
  time: number
  position: THREE.Vector3
  interpolationType: 'linear' | 'cubic'
}

export interface PlayerAction {
  type: 'shoot' | 'reload' | 'jump' | 'crouch' | 'aim' | 'use' | 'death' | 'respawn'
  timestamp: number
  data: any
}

export interface PlayerReplayStats {
  kills: number
  deaths: number
  assists: number
  damage: number
  accuracy: number
  headshots: number
  score: number
  survivalTime: number
}

export interface ReplayEvent {
  id: string
  type: 'kill' | 'death' | 'objective' | 'vehicle' | 'explosion' | 'chat' | 'system'
  timestamp: number
  playerId: string
  position: THREE.Vector3
  data: any
}

export interface ReplayHighlight {
  id: string
  type: 'kill' | 'multi_kill' | 'headshot' | 'clutch' | 'comeback' | 'trickshot'
  timestamp: number
  duration: number
  playerId: string
  description: string
  thumbnail?: string
  videoClip?: string
}

export interface RecordingData {
  frames: ReplayFrame[]
  events: ReplayEvent[]
  timestamp: number
  duration: number
}

export interface ReplayFrame {
  timestamp: number
  players: Map<string, ReplayPlayerData>
  gameState: GameState
}

export interface ReplayPlayerData {
  position: THREE.Vector3
  rotation: THREE.Euler
  health: number
  armor: number
  weapon: string
  isAlive: boolean
  isAiming: boolean
  isShooting: boolean
}

export interface GameState {
  timeRemaining: number
  score: Map<string, number>
  zone: {
    center: THREE.Vector3
    radius: number
    nextRadius: number
    nextCenter: THREE.Vector3
  }
}

export interface ReplaySettings {
  quality: 'low' | 'medium' | 'high' | 'ultra'
  frameRate: number
  compressionEnabled: boolean
  autoSave: boolean
  maxDuration: number // seconds
  maxFileSize: number // bytes
  includeAudio: boolean
  includeChat: boolean
  includeMinimap: boolean
}

export interface ReplayControls {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  playbackSpeed: number
  volume: number
  cameraMode: CameraPerspective['type']
  showUI: boolean
  showMinimap: boolean
  showChat: boolean
}

// Social Feed
export interface SocialFeed {
  posts: SocialPost[]
  filters: SocialFeedFilters
  settings: SocialFeedSettings
}

export interface SocialPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  displayName?: string
  type: 'match_result' | 'achievement' | 'highlight' | 'status' | 'screenshot' | 'clip'
  content: string
  media?: MediaContent[]
  gameData?: GameData
  timestamp: Date
  likes: number
  comments: SocialComment[]
  shares: number
  tags: string[]
  visibility: 'public' | 'friends' | 'private'
  isEdited: boolean
  editHistory: PostEdit[]
}

export interface MediaContent {
  id: string
  type: 'image' | 'video' | 'clip'
  url: string
  thumbnail?: string
  duration?: number
  size: number
  metadata?: any
}

export interface GameData {
  mode: string
  map: string
  score: number
  placement: number
  kills: number
  deaths: number
  kd: number
  duration: number
  achievements: string[]
}

export interface SocialComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  displayName?: string
  content: string
  timestamp: Date
  likes: number
  replies: SocialComment[]
}

export interface PostEdit {
  timestamp: Date
  originalContent: string
  newContent: string
}

export interface SocialFeedFilters {
  contentType: 'all' | 'matches' | 'achievements' | 'highlights' | 'status'
  timeRange: 'today' | 'week' | 'month' | 'all'
  author: 'all' | 'friends' | 'self'
  sortBy: 'recent' | 'popular' | 'trending'
}

export interface SocialFeedSettings {
  showFriendsOnly: boolean
  nsfwFilter: boolean
  autoPlayVideos: boolean
  showSpoilers: boolean
  customFilters: string[]
}

export class GLXYSocialFeatures {
  private userId: string
  private friends: Map<string, Friend> = new Map()
  private friendRequests: Map<string, FriendRequest> = new Map()
  private parties: Map<string, Party> = new Map()
  private currentParty: Party | null = null
  public voiceChat: VoiceChatSystem
  public replaySystem: ReplaySystem
  private socialFeed: SocialFeed

  // WebRTC for voice chat
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private signalingServer: any // WebSocket connection

  constructor(userId: string) {
    this.userId = userId
    this.voiceChat = this.initializeVoiceChat()
    this.replaySystem = this.initializeReplaySystem()
    this.socialFeed = this.initializeSocialFeed()

    this.setupSignalingConnection()
    this.setupEventListeners()
  }

  private initializeVoiceChat(): VoiceChatSystem {
    return {
      isEnabled: false,
      inputDevice: null,
      outputDevice: null,
      audioContext: new (window.AudioContext || (window as any).webkitAudioContext)(),
      localStream: null,
      peerConnections: new Map(),
      remoteStreams: new Map(),
      participants: new Map(),
      volume: new Map(),
      isMuted: false,
      isDeafened: false,
      isRecording: false,
      audioLevel: 0,
      settings: {
        inputGain: 1.0,
        outputGain: 1.0,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        vadEnabled: true,
        vadThreshold: 0.01,
        compressionEnabled: true,
        encryptionEnabled: true,
        spatialAudio: true,
        maxDistance: 50
      }
    }
  }

  private initializeReplaySystem(): ReplaySystem {
    return {
      isRecording: false,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      currentReplay: null,
      replays: [],
      settings: {
        quality: 'high',
        frameRate: 60,
        compressionEnabled: true,
        autoSave: true,
        maxDuration: 3600, // 1 hour
        maxFileSize: 1073741824, // 1GB
        includeAudio: true,
        includeChat: true,
        includeMinimap: true
      },
      controls: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        playbackSpeed: 1.0,
        volume: 0.8,
        cameraMode: 'first_person',
        showUI: true,
        showMinimap: true,
        showChat: true
      },
      recordingData: {
        frames: [],
        events: [],
        timestamp: 0,
        duration: 0
      }
    }
  }

  private initializeSocialFeed(): SocialFeed {
    return {
      posts: [],
      filters: {
        contentType: 'all',
        timeRange: 'week',
        author: 'all',
        sortBy: 'recent'
      },
      settings: {
        showFriendsOnly: false,
        nsfwFilter: true,
        autoPlayVideos: false,
        showSpoilers: true,
        customFilters: []
      }
    }
  }

  private setupSignalingConnection(): void {
    // Connect to signaling server for WebRTC
    // This would connect to your WebSocket server
    this.signalingServer = {
      on: (event: string, callback: Function) => {},
      emit: (event: string, data: any) => {},
      connected: true
    }

    this.signalingServer.on('voice-offer', this.handleVoiceOffer.bind(this))
    this.signalingServer.on('voice-answer', this.handleVoiceAnswer.bind(this))
    this.signalingServer.on('ice-candidate', this.handleIceCandidate.bind(this))
  }

  private setupEventListeners(): void {
    // Set up event listeners for social features
  }

  // Friend System Methods
  public async sendFriendRequest(friendId: string, message: string = ''): Promise<boolean> {
    try {
      // Send friend request via API
      const request: FriendRequest = {
        id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUser: this.userId,
        toUser: friendId,
        status: 'pending',
        message,
        timestamp: new Date()
      }

      // API call to send friend request
      // await api.post('/friends/request', request)

      this.friendRequests.set(request.id, request)
      return true
    } catch (error) {
      console.error('Failed to send friend request:', error)
      return false
    }
  }

  public async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const request = this.friendRequests.get(requestId)
      if (!request) return false

      // API call to accept friend request
      // await api.post('/friends/accept', { requestId })

      // Create friendship
      const friend: Friend = {
        id: request.fromUser,
        userId: request.fromUser,
        username: 'User_' + request.fromUser,
        displayName: 'Display Name',
        status: 'online',
        lastSeen: new Date(),
        friendSince: new Date(),
        isFavorite: false,
        isBlocked: false,
        mutualFriends: 0,
        level: 1,
        rank: 'Bronze',
        stats: {
          wins: 0,
          losses: 0,
          kd: 1.0,
          accuracy: 50,
          playtime: 0,
          favoriteMode: 'battle_royale',
          recentMatches: []
        },
        achievements: []
      }

      this.friends.set(request.fromUser, friend)
      this.friendRequests.delete(requestId)

      return true
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      return false
    }
  }

  public async declineFriendRequest(requestId: string): Promise<boolean> {
    try {
      // API call to decline friend request
      // await api.post('/friends/decline', { requestId })

      this.friendRequests.delete(requestId)
      return true
    } catch (error) {
      console.error('Failed to decline friend request:', error)
      return false
    }
  }

  public removeFriend(friendId: string): boolean {
    const friend = this.friends.get(friendId)
    if (!friend) return false

    // API call to remove friend
    // await api.delete(`/friends/${friendId}`)

    this.friends.delete(friendId)
    return true
  }

  public blockUser(userId: string): boolean {
    const friend = this.friends.get(userId)
    if (friend) {
      friend.isBlocked = true
      // API call to block user
      // await api.post(`/users/${userId}/block`)
      return true
    }
    return false
  }

  public getFriends(): Friend[] {
    return Array.from(this.friends.values()).filter(f => !f.isBlocked)
  }

  public getFriendRequests(): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter(r => r.status === 'pending')
  }

  public getOnlineFriends(): Friend[] {
    return this.getFriends().filter(f => f.status === 'online')
  }

  // Party/Team System Methods
  public createParty(name: string, maxMembers: number = 4, isPrivate: boolean = false): Party {
    const party: Party = {
      id: `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      leaderId: this.userId,
      members: [{
        userId: this.userId,
        username: 'Current User',
        displayName: 'Display Name',
        role: 'leader',
        status: 'connected',
        joinTime: new Date(),
        isMuted: false,
        isDeafened: false,
        volume: 1.0,
        ping: 0,
        platform: 'pc'
      }],
      maxMembers,
      isPrivate,
      inviteCode: isPrivate ? this.generateInviteCode() : undefined,
      description: '',
      tags: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      isPlaying: false,
      voiceChat: {
        enabled: true,
        quality: 'high',
        pushToTalk: false,
        audioEffects: true,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        spatialAudio: true
      },
      settings: {
        allowInvites: true,
        autoAcceptFriends: false,
        voiceChatRequired: false,
        crossPlatform: true,
        kickLeaderPermission: false,
        disbandOnLeaderLeave: false
      }
    }

    this.parties.set(party.id, party)
    this.currentParty = party

    return party
  }

  public joinParty(partyId: string, password?: string): boolean {
    const party = this.parties.get(partyId)
    if (!party) return false

    if (party.members.length >= party.maxMembers) return false
    if (party.isPrivate && party.password !== password) return false

    const member: PartyMember = {
      userId: this.userId,
      username: 'Current User',
      displayName: 'Display Name',
      role: 'member',
      status: 'connected',
      joinTime: new Date(),
      isMuted: false,
      isDeafened: false,
      volume: 1.0,
      ping: 0,
      platform: 'pc'
    }

    party.members.push(member)
    party.lastActivity = new Date()

    this.currentParty = party

    // Join voice chat if enabled
    if (party.voiceChat.enabled) {
      this.joinPartyVoiceChat(party)
    }

    return true
  }

  public leaveParty(partyId: string): boolean {
    const party = this.parties.get(partyId)
    if (!party) return false

    // Remove member from party
    party.members = party.members.filter(m => m.userId !== this.userId)

    // Leave voice chat
    if (party.voiceChat.enabled) {
      this.leavePartyVoiceChat(party)
    }

    // Update current party
    if (this.currentParty?.id === partyId) {
      this.currentParty = null
    }

    // Disband party if empty or leader left and settings require it
    if (party.members.length === 0 ||
        (party.leaderId === this.userId && party.settings.disbandOnLeaderLeave)) {
      this.disbandParty(partyId)
    }

    return true
  }

  public inviteToParty(partyId: string, userId: string): boolean {
    const party = this.parties.get(partyId)
    if (!party || party.leaderId !== this.userId) return false

    // Send invitation via signaling server
    this.signalingServer.emit('party-invite', {
      partyId,
      fromUser: this.userId,
      toUser: userId,
      partyName: party.name
    })

    return true
  }

  public kickFromParty(partyId: string, userId: string): boolean {
    const party = this.parties.get(partyId)
    if (!party || party.leaderId !== this.userId) return false

    // Remove member from party
    party.members = party.members.filter(m => m.userId !== userId)

    // Force leave voice chat
    if (party.voiceChat.enabled) {
      this.removeUserFromPartyVoiceChat(party, userId)
    }

    return true
  }

  private disbandParty(partyId: string): void {
    // Remove all members from voice chat
    const party = this.parties.get(partyId)
    if (party && party.voiceChat.enabled) {
      party.members.forEach(member => {
        this.removeUserFromPartyVoiceChat(party, member.userId)
      })
    }

    this.parties.delete(partyId)

    if (this.currentParty?.id === partyId) {
      this.currentParty = null
    }
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  // Voice Chat Methods
  public async enableVoiceChat(): Promise<boolean> {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.voiceChat.settings.echoCancellation,
          noiseSuppression: this.voiceChat.settings.noiseSuppression,
          autoGainControl: this.voiceChat.settings.autoGainControl,
          sampleRate: 48000,
          channelCount: 1
        }
      })

      this.voiceChat.localStream = stream
      this.voiceChat.isEnabled = true

      // Set up audio level monitoring
      this.setupAudioLevelMonitoring()

      return true
    } catch (error) {
      console.error('Failed to enable voice chat:', error)
      return false
    }
  }

  public disableVoiceChat(): void {
    if (this.voiceChat.localStream) {
      this.voiceChat.localStream.getTracks().forEach(track => track.stop())
      this.voiceChat.localStream = null
    }

    this.voiceChat.isEnabled = false

    // Disconnect from all voice calls
    this.voiceChat.participants.forEach((participant, userId) => {
      this.disconnectVoiceChat(userId)
    })
  }

  public setMuted(muted: boolean): void {
    this.voiceChat.isMuted = muted

    if (this.voiceChat.localStream) {
      this.voiceChat.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
  }

  public setDeafened(deafened: boolean): void {
    this.voiceChat.isDeafened = deafened

    this.voiceChat.participants.forEach((participant, userId) => {
      participant.volume = deafened ? 0 : this.voiceChat.volume.get(userId) || 1.0
      if (participant.audioElement) {
        participant.audioElement.volume = participant.volume
      }
    })
  }

  public setParticipantVolume(userId: string, volume: number): void {
    this.voiceChat.volume.set(userId, volume)

    const participant = this.voiceChat.participants.get(userId)
    if (participant && participant.audioElement) {
      participant.audioElement.volume = volume
    }
  }

  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const peerConnection = new RTCPeerConnection(configuration)
    this.peerConnections.set(userId, peerConnection)

    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingServer.emit('ice-candidate', {
          candidate: event.candidate,
          toUser: userId
        })
      }
    }

    peerConnection.ontrack = (event) => {
      this.handleRemoteStream(userId, event.streams[0])
    }

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        this.disconnectVoiceChat(userId)
      }
    }

    return peerConnection
  }

  private async handleVoiceOffer(data: any): Promise<void> {
    const { fromUser, offer } = data

    if (fromUser === this.userId) return

    const peerConnection = await this.createPeerConnection(fromUser)

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    this.signalingServer.emit('voice-answer', {
      answer,
      toUser: fromUser
    })
  }

  private async handleVoiceAnswer(data: any): Promise<void> {
    const { fromUser, answer } = data

    const peerConnection = this.peerConnections.get(fromUser)
    if (!peerConnection) return

    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  private async handleIceCandidate(data: any): Promise<void> {
    const { fromUser, candidate } = data

    const peerConnection = this.peerConnections.get(fromUser)
    if (!peerConnection) return

    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

  private handleRemoteStream(userId: string, stream: MediaStream): void {
    const audioElement = new Audio()
    audioElement.srcObject = stream
    audioElement.autoplay = true
    audioElement.volume = this.voiceChat.volume.get(userId) || 1.0

    const participant: VoiceParticipant = {
      id: userId,
      stream,
      audioElement,
      volume: this.voiceChat.volume.get(userId) || 1.0,
      isMuted: false,
      isSpeaking: false,
      audioLevel: 0,
      ping: 0
    }

    this.voiceChat.participants.set(userId, participant)
    this.voiceChat.remoteStreams.set(userId, stream)
  }

  private joinPartyVoiceChat(party: Party): void {
    party.members.forEach(member => {
      if (member.userId !== this.userId && member.status === 'connected') {
        this.connectVoiceChat(member.userId)
      }
    })
  }

  private leavePartyVoiceChat(party: Party): void {
    party.members.forEach(member => {
      if (member.userId !== this.userId) {
        this.disconnectVoiceChat(member.userId)
      }
    })
  }

  private removeUserFromPartyVoiceChat(party: Party, userId: string): void {
    const participant = this.voiceChat.participants.get(userId)
    if (participant) {
      this.disconnectVoiceChat(userId)
    }
  }

  private async connectVoiceChat(userId: string): Promise<boolean> {
    try {
      const peerConnection = await this.createPeerConnection(userId)

      if (this.voiceChat.localStream) {
        this.voiceChat.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.voiceChat.localStream!)
        })
      }

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      this.signalingServer.emit('voice-offer', {
        offer,
        toUser: userId
      })

      return true
    } catch (error) {
      console.error('Failed to connect voice chat:', error)
      return false
    }
  }

  private disconnectVoiceChat(userId: string): void {
    const peerConnection = this.peerConnections.get(userId)
    if (peerConnection) {
      peerConnection.close()
      this.peerConnections.delete(userId)
    }

    const participant = this.voiceChat.participants.get(userId)
    if (participant) {
      if (participant.audioElement) {
        participant.audioElement.pause()
        participant.audioElement.srcObject = null
      }
      this.voiceChat.participants.delete(userId)
    }

    const remoteStream = this.voiceChat.remoteStreams.get(userId)
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      this.voiceChat.remoteStreams.delete(userId)
    }

    this.voiceChat.volume.delete(userId)
  }

  private setupAudioLevelMonitoring(): void {
    if (!this.voiceChat.localStream) return

    const audioContext = this.voiceChat.audioContext
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(this.voiceChat.localStream)
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, audioContext.sampleRate)

    analyser.smoothingTimeConstant = 0.8
    analyser.fftSize = 256

    microphone.connect(analyser)
    analyser.connect(javascriptNode)
    javascriptNode.connect(audioContext.destination)

    javascriptNode.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(array)

      let values = 0
      const length = array.length
      for (let i = 0; i < length; i++) {
        values += array[i]
      }

      this.voiceChat.audioLevel = values / length
    }
  }

  // Replay System Methods
  public startRecording(): boolean {
    if (this.replaySystem.isRecording) return false

    this.replaySystem.isRecording = true
    this.replaySystem.recordingData = {
      frames: [],
      events: [],
      timestamp: Date.now(),
      duration: 0
    }

    toast.success('Recording started')
    return true
  }

  public stopRecording(): boolean {
    if (!this.replaySystem.isRecording) return false

    this.replaySystem.isRecording = false

    // Save replay
    const replay: Replay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Match Replay ${new Date().toLocaleString()}`,
      description: '',
      gameId: 'current_game',
      matchId: 'match_123',
      map: 'erangel',
      mode: 'battle_royale',
      duration: this.replaySystem.recordingData.duration,
      fileSize: JSON.stringify(this.replaySystem.recordingData).length,
      date: new Date(),
      players: [],
      events: this.replaySystem.recordingData.events,
      highlights: [],
      tags: ['auto'],
      isPublic: false,
      isFavorite: false,
      views: 0,
      likes: 0,
      downloads: 0,
      recordingData: this.replaySystem.recordingData
    }

    this.replaySystem.replays.push(replay)
    this.replaySystem.currentReplay = replay

    toast.success('Recording saved')
    return true
  }

  public playReplay(replayId: string): boolean {
    const replay = this.replaySystem.replays.find(r => r.id === replayId)
    if (!replay) return false

    this.replaySystem.currentReplay = replay
    this.replaySystem.isPlaying = true
    this.replaySystem.controls.currentTime = 0

    this.startReplayPlayback(replay)
    return true
  }

  public pauseReplay(): boolean {
    if (!this.replaySystem.isPlaying) return false

    this.replaySystem.isPlaying = false
    return true
  }

  public resumeReplay(): boolean {
    if (!this.replaySystem.isPaused) return false

    this.replaySystem.isPlaying = true
    return true
  }

  public stopReplay(): boolean {
    this.replaySystem.isPlaying = false
    this.replaySystem.isPaused = false
    this.replaySystem.currentTime = 0
    return true
  }

  public setReplaySpeed(speed: number): void {
    this.replaySystem.controls.playbackSpeed = Math.max(0.25, Math.min(4, speed))
  }

  public seekReplay(time: number): void {
    this.replaySystem.controls.currentTime = Math.max(0, Math.min(time, this.replaySystem.controls.duration))
  }

  private startReplayPlayback(replay: Replay): void {
    // Initialize replay playback
    this.replaySystem.controls.duration = replay.duration
    this.replaySystem.controls.currentTime = 0

    // Start playback loop
    const playbackLoop = () => {
      if (!this.replaySystem.isPlaying) return

      const deltaTime = 16 / 1000 * this.replaySystem.controls.playbackSpeed
      this.replaySystem.controls.currentTime += deltaTime

      // Update replay frame
      this.updateReplayFrame(replay, this.replaySystem.controls.currentTime)

      if (this.replaySystem.controls.currentTime >= this.replaySystem.controls.duration) {
        this.stopReplay()
      } else {
        requestAnimationFrame(playbackLoop)
      }
    }

    requestAnimationFrame(playbackLoop)
  }

  private updateReplayFrame(replay: Replay, currentTime: number): void {
    // Find the appropriate frame for the current time
    const frameIndex = Math.floor(currentTime * 60) // 60 FPS

    if (frameIndex < replay.players.length) {
      const frame = replay.recordingData.frames[frameIndex]
      if (frame) {
        // Update player positions and game state
        this.updateReplayPlayers(frame.players)
        this.updateReplayGameState(frame.gameState)
      }
    }

    // Update UI elements
    this.updateReplayControls()
  }

  private updateReplayPlayers(players: Map<string, ReplayPlayerData>): void {
    // Update player positions in 3D scene
    players.forEach((playerData, userId) => {
      const playerMesh = this.findPlayerMesh(userId)
      if (playerMesh) {
        playerMesh.position.copy(playerData.position)
        playerMesh.rotation.copy(playerData.rotation)
      }
    })
  }

  private updateReplayGameState(gameState: GameState): void {
    // Update game state (zone, timer, scores, etc.)
    // This would update the battle royale zone, timer, and other game elements
  }

  private updateReplayControls(): void {
    // Update replay UI controls (play/pause buttons, timeline, etc.)
    // This would update the replay control panel
  }

  private findPlayerMesh(userId: string): THREE.Object3D | null {
    // Find player mesh in scene
    // This would search the Three.js scene for the player's mesh
    return null
  }

  // Social Feed Methods
  public createPost(type: SocialPost['type'], content: string, media?: MediaContent[], gameData?: GameData): string {
    const post: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId: this.userId,
      authorName: 'Current User',
      displayName: 'Display Name',
      type,
      content,
      media,
      gameData,
      timestamp: new Date(),
      likes: 0,
      comments: [],
      shares: 0,
      tags: [],
      visibility: 'public',
      isEdited: false,
      editHistory: []
    }

    this.socialFeed.posts.unshift(post)
    this.trimSocialFeed()

    // Save post to server
    // await api.post('/social/posts', post)

    return post.id
  }

  public likePost(postId: string): boolean {
    const post = this.socialFeed.posts.find(p => p.id === postId)
    if (!post) return false

    post.likes++

    // Save to server
    // await api.post(`/social/posts/${postId}/like`)

    return true
  }

  public commentOnPost(postId: string, content: string): boolean {
    const post = this.socialFeed.posts.find(p => p.id === postId)
    if (!post) return false

    const comment: SocialComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId,
      authorId: this.userId,
      authorName: 'Current User',
      displayName: 'Display Name',
      content,
      timestamp: new Date(),
      likes: 0,
      replies: []
    }

    post.comments.push(comment)

    // Save to server
    // await api.post(`/social/posts/${postId}/comments`, comment)

    return true
  }

  public sharePost(postId: string): boolean {
    const post = this.socialFeed.posts.find(p => p.id === postId)
    if (!post) return false

    post.shares++

    // Save to server
    // await api.post(`/social/posts/${postId}/share`)

    return true
  }

  public deletePost(postId: string): boolean {
    const postIndex = this.socialFeed.posts.findIndex(p => p.id === postId)
    if (postIndex === -1) return false

    const post = this.socialFeed.posts[postIndex]
    if (post.authorId !== this.userId) return false

    this.socialFeed.posts.splice(postIndex, 1)

    // Delete from server
    // await api.delete(`/social/posts/${postId}`)

    return true
  }

  private trimSocialFeed(): void {
    // Keep only the most recent posts
    const maxPosts = 100
    if (this.socialFeed.posts.length > maxPosts) {
      this.socialFeed.posts = this.socialFeed.posts.slice(0, maxPosts)
    }
  }

  // Public Getters
  public getCurrentParty(): Party | null {
    return this.currentParty
  }

  public getParty(partyId: string): Party | null {
    return this.parties.get(partyId) || null
  }

  public getParties(): Party[] {
    return Array.from(this.parties.values())
  }

  public getReplays(): Replay[] {
    return this.replaySystem.replays
  }

  public getCurrentReplay(): Replay | null {
    return this.replaySystem.currentReplay
  }

  public getSocialFeedPosts(limit?: number): SocialPost[] {
    let posts = this.socialFeed.posts

    // Apply filters
    if (this.socialFeed.filters.author !== 'all') {
      // Filter by author
    }

    if (this.socialFeed.filters.contentType !== 'all') {
      // Filter by content type
    }

    if (this.socialFeed.filters.timeRange !== 'all') {
      // Filter by time range
      const now = new Date()
      const filterTime = new Date()

      switch (this.socialFeed.filters.timeRange) {
        case 'today':
          filterTime.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterTime.setDate(filterTime.getDate() - 7)
          break
        case 'month':
          filterTime.setMonth(filterTime.getMonth() - 1)
          break
      }

      posts = posts.filter(post => post.timestamp >= filterTime)
    }

    // Sort posts
    switch (this.socialFeed.filters.sortBy) {
      case 'recent':
        posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        break
      case 'popular':
        posts.sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares))
        break
      case 'trending':
        // More complex trending algorithm
        break
    }

    if (limit) {
      posts = posts.slice(0, limit)
    }

    return posts
  }

  public getVoiceChatStatus(): VoiceChatSystem {
    return { ...this.voiceChat }
  }

  public getReplaySystem(): ReplaySystem {
    return { ...this.replaySystem }
  }

  public getReplayControls(): ReplayControls {
    return { ...this.replaySystem.controls }
  }

  // Cleanup
  public destroy(): void {
    // Disconnect all voice chats
    this.voiceChat.participants.forEach((_, userId) => {
      this.disconnectVoiceChat(userId)
    })

    // Stop recording if active
    if (this.replaySystem.isRecording) {
      this.stopRecording()
    }

    // Stop replay if playing
    if (this.replaySystem.isPlaying) {
      this.stopReplay()
    }

    // Close signaling connection
    if (this.signalingServer && this.signalingServer.close) {
      this.signalingServer.close()
    }

    // Clear all collections
    this.friends.clear()
    this.friendRequests.clear()
    this.parties.clear()
    this.currentParty = null
    this.peerConnections.clear()
    this.voiceChat.participants.clear()
    this.voiceChat.remoteStreams.clear()
    this.voiceChat.volume.clear()
    this.replaySystem.replays.length = 0
    this.replaySystem.currentReplay = null
    this.socialFeed.posts.length = 0
  }
}

// React Component for Social Features UI
export function GLXYSocialFeaturesUI() {
  const [socialFeatures, setSocialFeatures] = useState<GLXYSocialFeatures | null>(null)
  const [activeTab, setActiveTab] = useState('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [currentParty, setCurrentParty] = useState<Party | null>(null)
  const [replays, setReplays] = useState<Replay[]>([])
  const [socialFeedPosts, setSocialFeedPosts] = useState<SocialPost[]>([])

  useEffect(() => {
    // Initialize social features with current user ID
    const userId = 'current_user'
    const features = new GLXYSocialFeatures(userId)
    setSocialFeatures(features)

    // Load initial data
    setFriends(features.getFriends())
    setFriendRequests(features.getFriendRequests())
    setCurrentParty(features.getCurrentParty())
    setReplays(features.getReplays())
    setSocialFeedPosts(features.getSocialFeedPosts(20))

    return () => {
      features.destroy()
    }
  }, [])

  const handleAcceptFriendRequest = (requestId: string) => {
    if (socialFeatures) {
      socialFeatures.acceptFriendRequest(requestId)
      setFriendRequests(socialFeatures.getFriendRequests())
      setFriends(socialFeatures.getFriends())
    }
  }

  const handleDeclineFriendRequest = (requestId: string) => {
    if (socialFeatures) {
      socialFeatures.declineFriendRequest(requestId)
      setFriendRequests(socialFeatures.getFriendRequests())
    }
  }

  const handleCreateParty = () => {
    if (socialFeatures) {
      const party = socialFeatures.createParty('My Party', 4, false)
      setCurrentParty(party)
    }
  }

  const handleStartRecording = () => {
    if (socialFeatures) {
      socialFeatures.startRecording()
    }
  }

  const handleStopRecording = () => {
    if (socialFeatures) {
      socialFeatures.stopRecording()
      setReplays(socialFeatures.getReplays())
    }
  }

  const handlePlayReplay = (replayId: string) => {
    if (socialFeatures) {
      socialFeatures.playReplay(replayId)
    }
  }

  const handleLikePost = (postId: string) => {
    if (socialFeatures) {
      socialFeatures.likePost(postId)
      setSocialFeedPosts(socialFeatures.getSocialFeedPosts())
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">GLXY Social Features</h1>
        <p className="text-gray-300">Voice chat, teams, replays, and social interactions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="party">Party</TabsTrigger>
          <TabsTrigger value="voice">Voice Chat</TabsTrigger>
          <TabsTrigger value="replays">Replays</TabsTrigger>
          <TabsTrigger value="feed">Social Feed</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Friend Requests */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Friend Requests
                  <Badge variant="secondary">{friendRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {friendRequests.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  friendRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                      <div>
                        <div className="font-medium text-white">{request.fromUser}</div>
                        <div className="text-xs text-gray-400">{request.message}</div>
                        <div className="text-xs text-gray-500">
                          {request.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(request.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineFriendRequest(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Online Friends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online Friends
                  <Badge variant="secondary">{friends.filter(f => f.status === 'online').length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friends.filter(f => f.status === 'online').map(friend => (
                    <motion.div
                      key={friend.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.avatar} alt={friend.displayName} />
                              <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{friend.displayName}</div>
                              <div className="text-sm text-gray-400">{friend.currentActivity || 'In Lobby'}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {friend.rank}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Level {friend.level}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Gamepad2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Friends */}
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle>All Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map(friend => (
                  <Card key={friend.id} className="bg-gray-700/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar} alt={friend.displayName} />
                          <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{friend.displayName}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              friend.status === 'online' ? 'bg-green-500' :
                              friend.status === 'away' ? 'bg-yellow-500' :
                              friend.status === 'busy' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            <span className="capitalize">{friend.status}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Last seen: {friend.lastSeen.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {friend.rank}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Level {friend.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="party" className="space-y-4">
          {currentParty ? (
            <Card className="bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Party
                  <Badge variant="secondary">{currentParty.members.length}/{currentParty.maxMembers}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{currentParty.name}</h3>
                    <p className="text-sm text-gray-400">
                      Created {currentParty.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => socialFeatures?.leaveParty(currentParty.id)}
                  >
                    Leave Party
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Party Members</Label>
                  <div className="space-y-2">
                    {currentParty.members.map(member => (
                      <div key={member.userId} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} alt={member.displayName} />
                            <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">
                              {member.displayName}
                              {member.role === 'leader' && (
                                <Badge variant="default" className="ml-2 text-xs">LEADER</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {member.status === 'connected' ? (
                                <span className="text-green-400">Connected</span>
                              ) : (
                                <span className="text-red-400">Disconnected</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Mic className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Video className="h-4 w-4" />
                          </Button>
                          {member.role === 'leader' && (
                            <Button size="sm" variant="outline">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gray-700/50 p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">4/4</div>
                      <div className="text-xs text-gray-400">Members</div>
                    </div>
                  </Card>
                  <Card className="bg-gray-700/50 p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">Ready</div>
                      <div className="text-xs text-gray-400">Status</div>
                    </div>
                  </Card>
                  <Card className="bg-gray-700/50 p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">High</div>
                      <div className="text-xs text-gray-400">Quality</div>
                    </div>
                  </Card>
                  <Card className="bg-gray-700/50 p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">15ms</div>
                      <div className="text-xs text-gray-400">Avg Ping</div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800/50">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Party</h3>
                <p className="text-gray-400 mb-4">Create or join a party to play with friends</p>
                <Button onClick={handleCreateParty}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Party
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Chat Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={socialFeatures?.getVoiceChatStatus().isEnabled ? "default" : "outline"}
                  onClick={() => socialFeatures?.enableVoiceChat()}
                >
                  {socialFeatures?.getVoiceChatStatus().isEnabled ? (
                    <Mic className="h-4 w-4 mr-2" />
                  ) : (
                    <MicOff className="h-4 w-4 mr-2" />
                  )}
                  {socialFeatures?.getVoiceChatStatus().isEnabled ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  variant={socialFeatures?.getVoiceChatStatus().isMuted ? "default" : "outline"}
                  onClick={() => socialFeatures?.setMuted(!socialFeatures?.getVoiceChatStatus().isMuted)}
                >
                  {socialFeatures?.getVoiceChatStatus().isMuted ? (
                    <MicOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  {socialFeatures?.getVoiceChatStatus().isMuted ? 'Unmute' : 'Mute'}
                </Button>

                <Button
                  variant={socialFeatures?.getVoiceChatStatus().isDeafened ? "default" : "outline"}
                  onClick={() => socialFeatures?.setDeafened(!socialFeatures?.getVoiceChatStatus().isDeafened)}
                >
                  {socialFeatures?.getVoiceChatStatus().isDeafened ? (
                    <VolumeX className="h-4 w-4 mr-2" />
                  ) : (
                    <Volume2 className="h-4 w-4 mr-2" />
                  )}
                  {socialFeatures?.getVoiceChatStatus().isDeafened ? 'Undeafen' : 'Deafen'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Input Volume</Label>
                  <Slider
                    defaultValue={[socialFeatures?.getVoiceChatStatus().settings.inputGain || 1]}
                    max={2}
                    min={0}
                    step={0.1}
                    onValueChange={([value]) => {
                      if (socialFeatures) {
                        socialFeatures.voiceChat.settings.inputGain = value
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Output Volume</Label>
                  <Slider
                    defaultValue={[socialFeatures?.getVoiceChatStatus().settings.outputGain || 1]}
                    max={2}
                    min={0}
                    step={0.1}
                    onValueChange={([value]) => {
                      if (socialFeatures) {
                        socialFeatures.voiceChat.settings.outputGain = value
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white">Voice Settings</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Noise Suppression</Label>
                    <Switch defaultChecked={socialFeatures?.getVoiceChatStatus().settings.noiseSuppression} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Echo Cancellation</Label>
                    <Switch defaultChecked={socialFeatures?.getVoiceChatStatus().settings.echoCancellation} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Spatial Audio</Label>
                    <Switch defaultChecked={socialFeatures?.getVoiceChatStatus().settings.spatialAudio} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Gain Control</Label>
                    <Switch defaultChecked={socialFeatures?.getVoiceChatStatus().settings.autoGainControl} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-4 rounded">
                <h4 className="font-semibold text-white mb-2">Audio Level</h4>
                <Progress value={socialFeatures?.getVoiceChatStatus().audioLevel ? socialFeatures.getVoiceChatStatus().audioLevel * 100 : 0} className="h-2" />
              </div>

              <div className="text-center text-sm text-gray-400">
                Connected: {socialFeatures?.voiceChat.participants.size || 0} participants
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replays" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Replay System
                <Badge variant="secondary">{replays.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={socialFeatures?.getReplaySystem().isRecording ? "destructive" : "default"}
                  onClick={socialFeatures?.getReplaySystem().isRecording ? handleStopRecording : handleStartRecording}
                >
                  {socialFeatures?.getReplaySystem().isRecording ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  Duration: {Math.floor((socialFeatures?.getReplaySystem().recordingData.duration || 0) / 60)}:{Math.floor((socialFeatures?.getReplaySystem().recordingData.duration || 0) % 60)}
                </div>
              </div>

              {socialFeatures?.getCurrentReplay() && (
                <Card className="bg-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Now Playing: {socialFeatures?.getCurrentReplay()?.name || 'No replay'}</span>
                      <Badge variant="secondary">
                        {socialFeatures?.getCurrentReplay() ?
                          `${Math.floor((socialFeatures.getCurrentReplay()?.duration || 0) / 60)}:${Math.floor((socialFeatures.getCurrentReplay()?.duration || 0) % 60)}` :
                          '0:00'
                        }
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={socialFeatures?.getReplayControls().isPlaying ? "default" : "outline"}
                        onClick={() => socialFeatures?.pauseReplay()}
                      >
                        {socialFeatures?.getReplayControls().isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => socialFeatures?.stopReplay()}
                      >
                        <Square className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => socialFeatures?.setReplaySpeed(socialFeatures.getReplayControls().playbackSpeed * 1.25)}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => socialFeatures?.setReplaySpeed(Math.max(0.25, socialFeatures.getReplayControls().playbackSpeed * 0.75))}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Progress: {Math.floor((socialFeatures?.getReplayControls().currentTime / socialFeatures?.getReplayControls().duration) * 100)}%</Label>
                      <Progress
                        value={(socialFeatures?.getReplayControls().currentTime / socialFeatures?.getReplayControls().duration) * 100 || 0}
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Playback Speed: {socialFeatures?.getReplayControls().playbackSpeed}x</Label>
                        <Slider
                          value={[socialFeatures?.getReplayControls().playbackSpeed]}
                          min={0.25}
                          max={4}
                          step={0.25}
                          onValueChange={([value]) => {
                            if (socialFeatures) {
                              socialFeatures.setReplaySpeed(value)
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Volume: {Math.round((socialFeatures?.getReplayControls().volume || 0) * 100)}%</Label>
                        <Slider
                          value={[socialFeatures?.getReplayControls().volume || 0.8]}
                          min={0}
                          max={1}
                          step={0.1}
                          onValueChange={([value]) => {
                            if (socialFeatures) {
                              socialFeatures.replaySystem.controls.volume = value
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-white">Saved Replays</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {replays.slice(0, 6).map(replay => (
                    <Card key={replay.id} className="bg-gray-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{replay.name}</h4>
                          <Badge variant="outline">
                            {replay.duration}s
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-400 mb-2">{replay.description}</div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{replay.map}</span>
                          <span>•</span>
                          <span>{replay.mode}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{replay.date.toLocaleDateString()}</span>
                          <span>{replay.views} views</span>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handlePlayReplay(replay.id)}>
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Social Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialFeedPosts.map(post => (
                  <Card key={post.id} className="bg-gray-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white">{post.authorName}</div>
                            <div className="text-xs text-gray-400">{post.timestamp.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleLikePost(post.id)}>
                            <Heart className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-400">{post.likes}</span>
                          <Button size="sm" variant="ghost" onClick={() => socialFeatures?.sharePost(post.id)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-white">{post.content}</p>
                        {post.gameData && (
                          <div className="mt-2 p-2 bg-gray-600/30 rounded">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">{post.gameData.mode}</span>
                              <span className="text-gray-300">#{post.gameData.placement} Place</span>
                              <span className="text-gray-300">{post.gameData.kills}/{post.gameData.deaths} K/D</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {post.media && post.media.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {post.media.map(media => (
                            <div key={media.id} className="relative">
                              {media.type === 'image' ? (
                                <img
                                  src={media.url}
                                  alt="Post media"
                                  className="w-full h-32 object-cover rounded"
                                />
                              ) : media.type === 'video' ? (
                                <video
                                  src={media.url}
                                  controls
                                  className="w-full h-32 rounded"
                                />
                              ) : null}
                              {media.duration && (
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                  {media.duration}s
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comment ({post.comments.length})
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Bookmark className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button size="sm" variant="outline">
                            <Flag className="h-3 w-3 mr-1" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Social Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Profile Visibility</Label>
                    <Select defaultValue="public">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Online Status</Label>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Activity Status</Label>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>NSFW Content Filter</Label>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-play Videos</Label>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Spoilers</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Friend Requests</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Party Invites</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Game Invites</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Achievement Unlocks</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Content Filters</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Content Type</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Content</SelectItem>
                          <SelectItem value="matches">Match Results</SelectItem>
                          <SelectItem value="achievements">Achievements</SelectItem>
                          <SelectItem value="highlights">Highlights</SelectItem>
                          <SelectItem value="status">Status Updates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Time Range</Label>
                      <Select defaultValue="week">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Author Filter</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                          <SelectItem value="self">My Posts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Sort By</Label>
                      <Select defaultValue="recent">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                          <SelectItem value="trending">Trending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GLXYSocialFeaturesUI