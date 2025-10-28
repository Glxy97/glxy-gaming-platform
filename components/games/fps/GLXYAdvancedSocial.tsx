// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  Video,
  Phone,
  Mic,
  MicOff,
  VideoOff,
  Gift,
  Calendar,
  Map,
  Home,
  Settings,
  Bell,
  CheckCircle,
  Heart,
  Share2,
  Star,
  Trophy,
  XCircle,
  Crown,
  Zap,
  Shield,
  Target,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize2,
  Grid3X3,
  User,
  UserPlus,
  UserMinus,
  Flag,
  Ban,
  Award,
  TrendingUp,
  Clock,
  Camera,
  Send,
  Smile,
  Paperclip,
  Pin,
  Search,
  Filter,
  Download,
  Upload,
  Lock,
  Unlock,
  Globe,
  Wifi,
  WifiOff,
  Radio,
  Headphones,
  Monitor
} from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  logo: string;
  type: 'casual' | 'competitive' | 'content_creator' | 'community';
  region: string;
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  achievements: string[];
  guildHouse: GuildHouse;
  created: number;
  rank: string;
  isPublic: boolean;
  requirements: {
    minLevel: number;
    minSkillRating: number;
    applicationRequired: boolean;
  };
  permissions: {
    canInvite: boolean;
    canKick: boolean;
    canManageEvents: boolean;
    canManageMembers: boolean;
  };
}

interface GuildHouse {
  name: string;
  type: 'mansion' | 'fortress' | 'clubhouse' | 'studio' | 'arena';
  rooms: GuildRoom[];
  decorations: GuildDecoration[];
  sharedInventory: GuildItem[];
  amenities: string[];
  customizationLevel: number;
}

interface GuildRoom {
  id: string;
  name: string;
  type: 'lobby' | 'meeting' | 'training' | 'relaxation' | 'showcase' | 'streaming';
  capacity: number;
  currentOccupants: string[];
  features: string[];
  isPrivate: boolean;
  permissions: string[];
}

interface GuildDecoration {
  id: string;
  name: string;
  type: 'trophy' | 'banner' | 'furniture' | 'lighting' | 'interactive';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockRequirement: string;
}

interface GuildItem {
  id: string;
  name: string;
  type: 'weapon' | 'cosmetic' | 'consumable' | 'tool';
  quantity: number;
  owner?: string;
  borrowedUntil?: number;
  restrictions: string[];
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'tournament' | 'social' | 'training' | 'streaming' | 'charity' | 'celebration';
  startDate: number;
  endDate: number;
  location: 'guild_house' | 'in_game' | 'virtual' | 'physical';
  maxParticipants: number;
  currentParticipants: number;
  rewards: {
    type: 'experience' | 'currency' | 'cosmetic' | 'title';
    amount: string;
    name: string;
  }[];
  requirements: string[];
  organizedBy: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  streamSettings?: {
    platform: 'twitch' | 'youtube' | 'kick';
    streamKey: string;
    isLive: boolean;
    viewers: number;
  };
}

interface VoiceChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'stage' | 'streaming';
  userLimit: number;
  currentUsers: VoiceUser[];
  isPrivate: boolean;
  category: string;
  permissions: {
    canSpeak: boolean;
    canConnect: boolean;
    canStream: boolean;
  };
}

interface VoiceUser {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
  isStreaming: boolean;
  platform: 'pc' | 'mobile' | 'vr' | 'console';
}

interface ChatMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
  channel: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system' | 'stream';
  reactions: { emoji: string; count: number; users: string[] }[];
  replies: ChatMessage[];
  isPinned: boolean;
  isEdited: boolean;
  editTimestamp?: number;
  attachments: ChatAttachment[];
}

interface ChatAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

interface StreamingIntegration {
  platform: 'twitch' | 'youtube' | 'kick' | 'trovo';
  isConnected: boolean;
  username: string;
  streamKey: string;
  isLive: boolean;
  viewers: number;
  title: string;
  category: string;
  tags: string[];
  chatIntegration: boolean;
  alertSettings: {
    newFollowers: boolean;
    newSubscribers: boolean;
    donations: boolean;
    raids: boolean;
  };
}

interface PersonalSpace {
  id: string;
  name: string;
  theme: 'modern' | 'cyberpunk' | 'fantasy' | 'minimalist' | 'luxury';
  layout: 'studio' | 'apartment' | 'house' | 'mansion' | 'penthouse';
  rooms: PersonalRoom[];
  decorations: PersonalDecoration[];
  achievements: PersonalAchievement[];
  visitors: PersonalSpaceVisitor[];
  privacy: 'public' | 'friends' | 'guild' | 'private';
}

interface PersonalRoom {
  id: string;
  name: string;
  type: 'living' | 'bedroom' | 'gaming' | 'trophy' | 'creative' | 'social';
  furniture: PersonalFurniture[];
  lighting: PersonalLighting;
  atmosphere: PersonalAtmosphere;
  maxVisitors: number;
}

interface PersonalDecoration {
  id: string;
  name: string;
  category: 'achievement' | 'cosmetic' | 'functional' | 'interactive';
  position: { x: number; y: number; z: number };
  unlocked: boolean;
  source: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'unique';
  type?: string;
}

interface PersonalFurniture {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: string;
  material: string;
}

interface PersonalLighting {
  type: 'natural' | 'warm' | 'cool' | 'neon' | 'dynamic';
  intensity: number;
  color: string;
  effects: string[];
}

interface PersonalAtmosphere {
  music: string;
  ambientSounds: string[];
  weatherEffect: string;
  timeOfDay: string;
  effects: string[];
}

interface PersonalAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: number;
  rarity: string;
  points: number;
}

interface PersonalSpaceVisitor {
  id: string;
  name: string;
  avatar: string;
  visitCount: number;
  lastVisit: number;
  permissions: string[];
  gifts: PersonalSpaceGift[];
}

interface PersonalSpaceGift {
  id: string;
  from: string;
  item: string;
  message: string;
  timestamp: number;
}

interface GLXYAdvancedSocialProps {
  userId: string;
  username: string;
  guildId?: string;
  gameMode: 'battle-royale' | 'fps' | 'racing';
  onGuildJoin?: (guildId: string) => void;
  onVoiceChannelJoin?: (channelId: string) => void;
}

export const GLXYAdvancedSocial: React.FC<GLXYAdvancedSocialProps> = ({
  userId,
  username,
  guildId,
  gameMode,
  onGuildJoin,
  onVoiceChannelJoin
}) => {
  const [activeTab, setActiveTab] = useState<'guilds' | 'housing' | 'events' | 'streaming' | 'voice'>('guilds');
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [voiceSettings, setVoiceSettings] = useState({
    inputVolume: 80,
    outputVolume: 100,
    pushToTalk: false,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true
  });

  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [streamingIntegration, setStreamingIntegration] = useState<StreamingIntegration>({
    platform: 'twitch',
    isConnected: false,
    username: '',
    streamKey: '',
    isLive: false,
    viewers: 0,
    title: '',
    category: gameMode,
    tags: [],
    chatIntegration: true,
    alertSettings: {
      newFollowers: true,
      newSubscribers: true,
      donations: true,
      raids: true
    }
  });

  const [personalSpace, setPersonalSpace] = useState<PersonalSpace | null>(null);
  const [isInPersonalSpace, setIsInPersonalSpace] = useState(false);
  const [spaceVisitors, setSpaceVisitors] = useState<string[]>([]);

  const [showGuildCreation, setShowGuildCreation] = useState(false);
  const [showEventCreation, setShowEventCreation] = useState(false);
  const [showStreamingSetup, setShowStreamingSetup] = useState(false);

  // Initialize mock data
  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Mock Guilds
    const mockGuilds: Guild[] = [
      {
        id: 'guild1',
        name: 'GLXY Elite Warriors',
        tag: 'GEW',
        description: 'Professional esports team focused on competitive gaming and community building',
        logo: '⚔️',
        type: 'competitive',
        region: 'Global',
        memberCount: 145,
        maxMembers: 200,
        level: 15,
        experience: 75000,
        achievements: ['Tournament Champions', 'Community Leaders', 'Top Rated Guild'],
        guildHouse: {
          name: 'Elite Fortress',
          type: 'fortress',
          rooms: [
            {
              id: 'room1',
              name: 'Main Hall',
              type: 'lobby',
              capacity: 50,
              currentOccupants: ['user1', 'user2'],
              features: ['voice_chat', 'text_chat', 'streaming', 'tournament_board'],
              isPrivate: false,
              permissions: ['all_members']
            },
            {
              id: 'room2',
              name: 'Strategy Room',
              type: 'meeting',
              capacity: 20,
              currentOccupants: [],
              features: ['whiteboard', 'screen_share', 'recording'],
              isPrivate: true,
              permissions: ['officers', 'members']
            }
          ],
          decorations: [
            {
              id: 'dec1',
              name: 'Championship Trophy',
              type: 'trophy',
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: 1,
              rarity: 'legendary',
              unlocked: true,
              unlockRequirement: 'Win Guild Tournament'
            }
          ],
          sharedInventory: [
            {
              id: 'item1',
              name: 'Training Weapons Pack',
              type: 'weapon',
              quantity: 10,
              restrictions: ['members_only']
            }
          ],
          amenities: ['training_grounds', 'streaming_studio', 'meeting_rooms', 'recreation_area'],
          customizationLevel: 8
        },
        created: Date.now() - 365 * 24 * 60 * 60 * 1000,
        rank: 'Diamond',
        isPublic: true,
        requirements: {
          minLevel: 25,
          minSkillRating: 1500,
          applicationRequired: true
        },
        permissions: {
          canInvite: true,
          canKick: false,
          canManageEvents: false,
          canManageMembers: false
        }
      },
      {
        id: 'guild2',
        name: 'Creative Content Creators',
        tag: 'CCC',
        description: 'Community for streamers, YouTubers, and content creators to collaborate and grow',
        logo: '🎬',
        type: 'content_creator',
        region: 'International',
        memberCount: 320,
        maxMembers: 500,
        level: 22,
        experience: 120000,
        achievements: ['Streaming Excellence', 'Community Growth', 'Content Innovation'],
        guildHouse: {
          name: 'Creator Studio',
          type: 'studio',
          rooms: [
            {
              id: 'room3',
              name: 'Streaming Hub',
              type: 'streaming',
              capacity: 100,
              currentOccupants: ['streamer1', 'streamer2'],
              features: ['multi_stream', 'chat_overlay', 'alerts', 'analytics'],
              isPrivate: false,
              permissions: ['all_members']
            }
          ],
          decorations: [],
          sharedInventory: [
            {
              id: 'item2',
              name: 'Stream Overlays Pack',
              type: 'cosmetic',
              quantity: 50,
              restrictions: ['creators_only']
            }
          ],
          amenities: ['streaming_rooms', 'editing_suite', 'collaboration_space', 'analytics_dashboard'],
          customizationLevel: 12
        },
        created: Date.now() - 730 * 24 * 60 * 60 * 1000,
        rank: 'Master',
        isPublic: true,
        requirements: {
          minLevel: 10,
          minSkillRating: 0,
          applicationRequired: true
        },
        permissions: {
          canInvite: true,
          canKick: false,
          canManageEvents: true,
          canManageMembers: false
        }
      }
    ];

    setGuilds(mockGuilds);
    if (mockGuilds.length > 0) {
      setSelectedGuild(mockGuilds[0]);
    }

    // Mock Voice Channels
    const mockVoiceChannels: VoiceChannel[] = [
      {
        id: 'vc1',
        name: 'General Chat',
        type: 'voice',
        userLimit: 0,
        currentUsers: [
          { id: 'user1', name: 'PlayerOne', avatar: '👤', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, isStreaming: false, platform: 'pc' },
          { id: 'user2', name: 'GamerPro', avatar: '🎮', isMuted: true, isDeafened: false, isSpeaking: false, volume: 80, isStreaming: false, platform: 'pc' }
        ],
        isPrivate: false,
        category: 'Main',
        permissions: {
          canSpeak: true,
          canConnect: true,
          canStream: true
        }
      },
      {
        id: 'vc2',
        name: 'Strategy Discussion',
        type: 'voice',
        userLimit: 10,
        currentUsers: [],
        isPrivate: false,
        category: 'Competitive',
        permissions: {
          canSpeak: true,
          canConnect: true,
          canStream: false
        }
      },
      {
        id: 'vc3',
        name: 'Streaming Room',
        type: 'streaming',
        userLimit: 5,
        currentUsers: [
          { id: 'streamer1', name: 'ProStreamer', avatar: '📺', isMuted: false, isDeafened: false, isSpeaking: true, volume: 100, isStreaming: true, platform: 'pc' }
        ],
        isPrivate: false,
        category: 'Content',
        permissions: {
          canSpeak: true,
          canConnect: true,
          canStream: true
        }
      }
    ];

    setVoiceChannels(mockVoiceChannels);

    // Mock Chat Messages
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        author: 'GuildMaster',
        authorId: 'gm1',
        content: 'Welcome to the guild! We have a tournament coming up next week.',
        timestamp: Date.now() - 3600000,
        channel: 'general',
        type: 'text',
        reactions: [
          { emoji: '👍', count: 12, users: ['user1', 'user2', 'user3'] },
          { emoji: '🎉', count: 8, users: ['user4', 'user5'] }
        ],
        replies: [],
        isPinned: true,
        isEdited: false,
        attachments: []
      },
      {
        id: 'msg2',
        author: 'PlayerOne',
        authorId: 'user1',
        content: 'Looking for teammates for ranked matches! Anyone interested?',
        timestamp: Date.now() - 1800000,
        channel: 'general',
        type: 'text',
        reactions: [
          { emoji: '🙋', count: 3, users: ['user6', 'user7'] }
        ],
        replies: [],
        isPinned: false,
        isEdited: false,
        attachments: []
      }
    ];

    setChatMessages(mockMessages);

    // Mock Community Events
    const mockEvents: CommunityEvent[] = [
      {
        id: 'event1',
        title: 'Weekly Guild Tournament',
        description: 'Compete against other guild members for glory and prizes',
        type: 'tournament',
        startDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        location: 'in_game',
        maxParticipants: 32,
        currentParticipants: 24,
        rewards: [
          { type: 'currency', amount: '5000', name: 'GLXY Coins' },
          { type: 'cosmetic', amount: '1', name: 'Champion Trophy' },
          { type: 'title', amount: '1', name: 'Guild Champion' }
        ],
        requirements: ['Level 25+', 'Guild Member'],
        organizedBy: 'Guild Officers',
        status: 'upcoming',
        streamSettings: {
          platform: 'twitch',
          streamKey: 'live_12345',
          isLive: false,
          viewers: 0
        }
      },
      {
        id: 'event2',
        title: 'Community Game Night',
        description: 'Casual gaming session with guild members and friends',
        type: 'social',
        startDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
        location: 'guild_house',
        maxParticipants: 50,
        currentParticipants: 18,
        rewards: [
          { type: 'experience', amount: '1000', name: 'Social XP' },
          { type: 'currency', amount: '500', name: 'GLXY Coins' }
        ],
        requirements: ['None'],
        organizedBy: 'Community Manager',
        status: 'upcoming'
      }
    ];

    setCommunityEvents(mockEvents);

    // Mock Personal Space
    const mockPersonalSpace: PersonalSpace = {
      id: 'space1',
      name: `${username}'s Penthouse`,
      theme: 'modern',
      layout: 'penthouse',
      rooms: [
        {
          id: 'room1',
          name: 'Living Room',
          type: 'living',
          furniture: [
            { id: 'f1', name: 'Modern Sofa', type: 'seating', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: 'gray', material: 'leather' },
            { id: 'f2', name: 'Gaming PC Setup', type: 'desk', position: { x: 5, y: 0, z: 0 }, rotation: { x: 0, y: 90, z: 0 }, color: 'black', material: 'metal' }
          ],
          lighting: {
            type: 'warm',
            intensity: 80,
            color: '#FFE4B5',
            effects: ['ambient']
          },
          atmosphere: {
            music: 'lofi_beats',
            ambientSounds: ['city_sounds', 'keyboard_typing'],
            weatherEffect: 'clear',
            timeOfDay: 'evening',
            effects: ['floating_particles']
          },
          maxVisitors: 10
        },
        {
          id: 'room2',
          name: 'Trophy Room',
          type: 'trophy',
          furniture: [
            { id: 'f3', name: 'Trophy Display', type: 'showcase', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: 'gold', material: 'glass' }
          ],
          lighting: {
            type: 'dynamic',
            intensity: 100,
            color: '#FFD700',
            effects: ['spotlight', 'sparkles']
          },
          atmosphere: {
            music: 'triumphant',
            ambientSounds: [],
            weatherEffect: 'none',
            timeOfDay: 'day',
            effects: ['achievement_glow']
          },
          maxVisitors: 5
        }
      ],
      decorations: [
        {
          id: 'dec1',
          name: 'First Victory Trophy',
          category: 'achievement',
          position: { x: 0, y: 1, z: 0 },
          unlocked: true,
          source: 'First Match Win',
          rarity: 'common',
          type: 'achievement'
        }
      ],
      achievements: [
        {
          id: 'ach1',
          name: 'Victory Royale',
          description: 'Win your first Battle Royale match',
          icon: '🏆',
          category: 'Combat',
          unlockedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          rarity: 'common',
          points: 100
        }
      ],
      visitors: [
        {
          id: 'v1',
          name: 'FriendOne',
          avatar: '👤',
          visitCount: 5,
          lastVisit: Date.now() - 2 * 24 * 60 * 60 * 1000,
          permissions: ['interact', 'chat'],
          gifts: [
            {
              id: 'gift1',
              from: 'FriendOne',
              item: 'Rare Decoration',
              message: 'Congratulations on your achievement!',
              timestamp: Date.now() - 24 * 60 * 60 * 1000
            }
          ]
        }
      ],
      privacy: 'friends'
    };

    setPersonalSpace(mockPersonalSpace);
  };

  const joinVoiceChannel = (channelId: string) => {
    setActiveVoiceChannel(channelId);
    onVoiceChannelJoin?.(channelId);

    // Add current user to channel
    setVoiceChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        return {
          ...channel,
          currentUsers: [
            ...channel.currentUsers,
            {
              id: userId,
              name: username,
              avatar: '👤',
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
              volume: 100,
              isStreaming: false,
              platform: 'pc'
            }
          ]
        };
      }
      return channel;
    }));
  };

  const leaveVoiceChannel = () => {
    if (!activeVoiceChannel) return;

    setVoiceChannels(prev => prev.map(channel => {
      if (channel.id === activeVoiceChannel) {
        return {
          ...channel,
          currentUsers: channel.currentUsers.filter(user => user.id !== userId)
        };
      }
      return channel;
    }));

    setActiveVoiceChannel(null);
  };

  const toggleMute = () => {
    if (!activeVoiceChannel) return;

    setVoiceChannels(prev => prev.map(channel => {
      if (channel.id === activeVoiceChannel) {
        return {
          ...channel,
          currentUsers: channel.currentUsers.map(user =>
            user.id === userId ? { ...user, isMuted: !user.isMuted } : user
          )
        };
      }
      return channel;
    }));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      author: username,
      authorId: userId,
      content: newMessage,
      timestamp: Date.now(),
      channel: selectedChannel,
      type: 'text',
      reactions: [],
      replies: [],
      isPinned: false,
      isEdited: false,
      attachments: []
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const joinGuild = (guild: Guild) => {
    onGuildJoin?.(guild.id);
    setSelectedGuild(guild);
  };

  const joinEvent = (event: CommunityEvent) => {
    // Simulate event registration
    setCommunityEvents(prev => prev.map(e =>
      e.id === event.id
        ? { ...e, currentParticipants: e.currentParticipants + 1 }
        : e
    ));
  };

  const startStreaming = () => {
    setStreamingIntegration(prev => ({
      ...prev,
      isLive: true,
      viewers: Math.floor(Math.random() * 1000) + 100
    }));
  };

  const stopStreaming = () => {
    setStreamingIntegration(prev => ({
      ...prev,
      isLive: false,
      viewers: 0
    }));
  };

  const visitPersonalSpace = (spaceId: string) => {
    setIsInPersonalSpace(true);
    setSpaceVisitors(prev => [...prev, userId]);
  };

  const leavePersonalSpace = () => {
    setIsInPersonalSpace(false);
    setSpaceVisitors(prev => prev.filter(id => id !== userId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'upcoming': return 'bg-blue-600';
      case 'completed': return 'bg-gray-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-purple-400">GLXY SOCIAL & COMMUNITY</h1>
          <Badge className="bg-purple-600">{gameMode.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsInPersonalSpace(!isInPersonalSpace)}
            className={isInPersonalSpace ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
          >
            <Home className="w-4 h-4 mr-2" />
            {isInPersonalSpace ? 'Leave Space' : 'Personal Space'}
          </Button>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            <Badge className="bg-red-600">3</Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-800">
        {[
          { id: 'guilds', label: 'Guilds', icon: Users },
          { id: 'housing', label: 'Guild Housing', icon: Home },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'streaming', label: 'Streaming', icon: Video },
          { id: 'voice', label: 'Voice & Chat', icon: MessageSquare }
        ].map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={activeTab === tab.id ? 'bg-purple-600' : 'text-gray-400 hover:text-white'}
          >
            {React.createElement(tab.icon, {
                className: "w-4 h-4 mr-2"
              })}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'guilds' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Available Guilds</h2>
              <Button onClick={() => setShowGuildCreation(true)} className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Guild
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guilds.map(guild => (
                <Card key={guild.id} className={`bg-gray-900 border-2 ${selectedGuild?.id === guild.id ? 'border-purple-500' : 'border-gray-700'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{guild.logo}</span>
                        <div>
                          <h3 className="font-semibold text-white">{guild.name}</h3>
                          <p className="text-sm text-gray-400">{guild.tag} • Level {guild.level}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-600">{guild.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{guild.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <span className="text-gray-400">Members:</span>
                        <span className="text-white ml-1">{guild.memberCount}/{guild.maxMembers}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Region:</span>
                        <span className="text-white ml-1">{guild.region}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rank:</span>
                        <span className="text-white ml-1">{guild.rank}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white ml-1 capitalize">{guild.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {selectedGuild?.id === guild.id ? (
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Joined
                        </Button>
                      ) : (
                        <Button
                          onClick={() => joinGuild(guild)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join Guild
                        </Button>
                      )}
                      <Button variant="outline" className="border-gray-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Guild Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGuild && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-semibold mb-2">{selectedGuild.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Minimum Level:</span>
                          <span className="text-white">{selectedGuild.requirements.minLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Skill Rating:</span>
                          <span className="text-white">{selectedGuild.requirements.minSkillRating}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Application:</span>
                          <span className="text-white">
                            {selectedGuild.requirements.applicationRequired ? 'Required' : 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                      <h5 className="text-white font-semibold mb-2">Guild Achievements</h5>
                      <div className="space-y-1">
                        {selectedGuild.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-gray-300">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                      <h5 className="text-white font-semibold mb-2">Your Permissions</h5>
                      <div className="space-y-1 text-sm">
                        {selectedGuild.permissions.canInvite && (
                          <div className="flex items-center space-x-2">
                            <UserPlus className="w-3 h-3 text-green-500" />
                            <span className="text-gray-300">Can invite members</span>
                          </div>
                        )}
                        {selectedGuild.permissions.canManageEvents && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-green-500" />
                            <span className="text-gray-300">Can manage events</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'housing' && selectedGuild && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>{selectedGuild.guildHouse.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-400">House Type</div>
                    <div className="text-lg font-semibold text-white capitalize">{selectedGuild.guildHouse.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Customization Level</div>
                    <div className="text-lg font-semibold text-white">{selectedGuild.guildHouse.customizationLevel}/15</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Rooms</div>
                    <div className="text-lg font-semibold text-white">{selectedGuild.guildHouse.rooms.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Decorations</div>
                    <div className="text-lg font-semibold text-white">{selectedGuild.guildHouse.decorations.length}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Available Rooms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedGuild.guildHouse.rooms.map(room => (
                      <div key={room.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-semibold">{room.name}</h5>
                          <Badge className="bg-blue-600 capitalize">{room.type}</Badge>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">
                          <div>Capacity: {room.currentOccupants.length}/{room.capacity}</div>
                          <div>Features: {room.features.join(', ')}</div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => joinVoiceChannel(room.id)}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Enter Room
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Shared Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedGuild.guildHouse.sharedInventory.map(item => (
                    <div key={item.id} className="p-3 bg-gray-800 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{item.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                        </div>
                        <div className="text-sm text-gray-300">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-gray-400">House Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedGuild.guildHouse.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="border-gray-600">
                      {amenity.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {communityEvents.map(event => (
            <Card key={event.id} className="bg-gray-900 border-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-400">{event.title}</CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{event.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Type</div>
                    <div className="text-white capitalize">{event.type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Location</div>
                    <div className="text-white capitalize">{event.location.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Start Date</div>
                    <div className="text-white">{new Date(event.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Participants</div>
                    <div className="text-white">{event.currentParticipants}/{event.maxParticipants}</div>
                  </div>
                </div>

                {event.rewards.length > 0 && (
                  <div>
                    <h5 className="text-white font-semibold mb-2">Rewards</h5>
                    <div className="space-y-1">
                      {event.rewards.map((reward, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">{reward.name}</span>
                          <span className="text-white">{reward.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={() => joinEvent(event)}
                    disabled={event.status !== 'upcoming' || event.currentParticipants >= event.maxParticipants}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                  {event.streamSettings && (
                    <Button
                      variant="outline"
                      className="border-gray-600"
                      onClick={() => {
                        if (event.streamSettings?.isLive) {
                          window.open(`https://twitch.tv/${streamingIntegration.username}`, '_blank');
                        }
                      }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {event.streamSettings?.isLive ? 'Watch Stream' : 'Stream Info'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'streaming' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-400 flex items-center space-x-2">
                    <Video className="w-5 h-5" />
                    <span>Streaming Studio</span>
                  </CardTitle>
                  {streamingIntegration.isLive && (
                    <Badge className="bg-red-600 animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE • {streamingIntegration.viewers} viewers
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  {streamingIntegration.isLive ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Radio className="w-8 h-8" />
                      </div>
                      <p className="text-white mb-2">{streamingIntegration.title}</p>
                      <p className="text-gray-400">Category: {streamingIntegration.category}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Stream is offline</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-400">Stream Title</label>
                    <input
                      type="text"
                      value={streamingIntegration.title}
                      onChange={(e) => setStreamingIntegration(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter stream title"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Category</label>
                    <select
                      value={streamingIntegration.category}
                      onChange={(e) => setStreamingIntegration(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="battle-royale">Battle Royale</option>
                      <option value="fps">FPS</option>
                      <option value="racing">Racing</option>
                      <option value="just_chatting">Just Chatting</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!streamingIntegration.isLive ? (
                    <Button
                      onClick={startStreaming}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <Button
                      onClick={stopStreaming}
                      className="flex-1 bg-gray-600 hover:bg-gray-700"
                    >
                      <VideoOff className="w-4 h-4 mr-2" />
                      End Stream
                    </Button>
                  )}
                  <Button variant="outline" className="border-gray-600">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Stream Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Platform</label>
                  <select
                    value={streamingIntegration.platform}
                    onChange={(e) => setStreamingIntegration(prev => ({ ...prev, platform: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="twitch">Twitch</option>
                    <option value="youtube">YouTube</option>
                    <option value="kick">Kick</option>
                    <option value="trovo">Trovo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Username</label>
                  <input
                    type="text"
                    value={streamingIntegration.username}
                    onChange={(e) => setStreamingIntegration(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Your username"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={streamingIntegration.chatIntegration}
                      onChange={(e) => setStreamingIntegration(prev => ({ ...prev, chatIntegration: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Enable chat integration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={streamingIntegration.alertSettings.newFollowers}
                      onChange={(e) => setStreamingIntegration(prev => ({
                        ...prev,
                        alertSettings: { ...prev.alertSettings, newFollowers: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">New follower alerts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={streamingIntegration.alertSettings.newSubscribers}
                      onChange={(e) => setStreamingIntegration(prev => ({
                        ...prev,
                        alertSettings: { ...prev.alertSettings, newSubscribers: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Subscriber alerts</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-gray-400">Recent Stream Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Peak Viewers</span>
                    <span className="text-white">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Viewers</span>
                    <span className="text-white">567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stream Duration</span>
                    <span className="text-white">3h 45m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">New Followers</span>
                    <span className="text-white">+42</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Voice Channels & Chat</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Voice Channels */}
                  <div>
                    <h4 className="text-white font-semibold mb-3">Voice Channels</h4>
                    <div className="space-y-2">
                      {voiceChannels.map(channel => (
                        <div
                          key={channel.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            activeVoiceChannel === channel.id ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                          onClick={() => activeVoiceChannel === channel.id ? leaveVoiceChannel() : joinVoiceChannel(channel.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {channel.type === 'streaming' ? (
                                <Radio className="w-4 h-4 text-red-500" />
                              ) : (
                                <Volume2 className="w-4 h-4 text-gray-400" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">{channel.name}</div>
                                <div className="text-xs text-gray-400">
                                  {channel.currentUsers.length}/{channel.userLimit || '∞'} users
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {channel.currentUsers.slice(0, 3).map(user => (
                                <div
                                  key={user.id}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    user.isSpeaking ? 'bg-green-600' : 'bg-gray-600'
                                  }`}
                                  title={user.name}
                                >
                                  {user.avatar}
                                </div>
                              ))}
                              {channel.currentUsers.length > 3 && (
                                <span className="text-xs text-gray-400">+{channel.currentUsers.length - 3}</span>
                              )}
                              {channel.type === 'streaming' && channel.currentUsers.some(u => u.isStreaming) && (
                                <Badge className="bg-red-600 text-xs">LIVE</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Text Chat</h4>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white"
                      >
                        <option value="general">#general</option>
                        <option value="strategy">#strategy</option>
                        <option value="off-topic">#off-topic</option>
                      </select>
                    </div>
                    <div className="h-64 bg-gray-800 rounded-lg p-3 overflow-y-auto mb-3">
                      <div className="space-y-2">
                        {chatMessages
                          .filter(msg => msg.channel === selectedChannel)
                          .map(message => (
                            <div key={message.id} className="flex items-start space-x-2">
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                                👤
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-white">{message.author}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </span>
                                  {message.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
                                </div>
                                <p className="text-sm text-gray-300">{message.content}</p>
                                {message.reactions.length > 0 && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    {message.reactions.map(reaction => (
                                      <span key={reaction.emoji} className="text-xs bg-gray-700 rounded px-1">
                                        {reaction.emoji} {reaction.count}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                      <Button
                        onClick={sendMessage}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Input Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceSettings.inputVolume}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, inputVolume: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-right">{voiceSettings.inputVolume}%</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Output Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceSettings.outputVolume}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, outputVolume: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-right">{voiceSettings.outputVolume}%</div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={voiceSettings.pushToTalk}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, pushToTalk: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Push to Talk</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={voiceSettings.noiseSuppression}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, noiseSuppression: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Noise Suppression</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={voiceSettings.echoCancellation}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, echoCancellation: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Echo Cancellation</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {activeVoiceChannel && (
              <Card className="bg-gray-900 border-green-500 mt-4">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Headphones className="w-5 h-5" />
                    <span>Voice Controls</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      onClick={toggleMute}
                      className={`w-full ${
                        voiceChannels.find(c => c.id === activeVoiceChannel)?.currentUsers.find(u => u.id === userId)?.isMuted
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {voiceChannels.find(c => c.id === activeVoiceChannel)?.currentUsers.find(u => u.id === userId)?.isMuted ? (
                        <MicOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Mic className="w-4 h-4 mr-2" />
                      )}
                      {voiceChannels.find(c => c.id === activeVoiceChannel)?.currentUsers.find(u => u.id === userId)?.isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      onClick={leaveVoiceChannel}
                      className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Leave Channel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Personal Space Modal */}
      {isInPersonalSpace && personalSpace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-blue-500 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>{personalSpace.name}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={leavePersonalSpace}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rooms */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Your Rooms</h4>
                  <div className="space-y-3">
                    {personalSpace.rooms.map(room => (
                      <div key={room.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-medium">{room.name}</h5>
                          <Badge className="bg-blue-600 capitalize">{room.type}</Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          Lighting: {room.lighting.type} • Atmosphere: {room.atmosphere.timeOfDay}
                        </div>
                        <div className="text-sm text-gray-400">
                          Furniture: {room.furniture.length} items
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decorations & Achievements */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Decorations & Achievements</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm text-gray-400 mb-2">Decorations</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {personalSpace.decorations.map(decoration => (
                          <div
                            key={decoration.id}
                            className={`p-2 rounded text-center ${
                              decoration.unlocked ? 'bg-blue-900/30' : 'bg-gray-800 opacity-50'
                            }`}
                          >
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="text-xs text-gray-300">{decoration.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm text-gray-400 mb-2">Achievements</h5>
                      <div className="space-y-2">
                        {personalSpace.achievements.map(achievement => (
                          <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-gray-800 rounded">
                            <span className="text-xl">{achievement.icon}</span>
                            <div>
                              <div className="text-sm font-medium text-white">{achievement.name}</div>
                              <div className="text-xs text-gray-400">{achievement.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visitors */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-white font-semibold mb-3">Recent Visitors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {personalSpace.visitors.map(visitor => (
                    <div key={visitor.id} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{visitor.avatar}</span>
                          <div>
                            <div className="text-sm font-medium text-white">{visitor.name}</div>
                            <div className="text-xs text-gray-400">{visitor.visitCount} visits</div>
                          </div>
                        </div>
                      </div>
                      {visitor.gifts.length > 0 && (
                        <div className="mt-2 text-xs text-green-400">
                          Gift: {visitor.gifts[0].item}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};