// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Users,
  Video,
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  BarChart3,
  Target,
  Shield,
  Zap,
  Crown,
  Star,
  Award,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize,
  Grid3X3,
  Radio,
  MessageSquare,
  User,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Upload,
  Share2,
  Bell,
  Calendar,
  DollarSign,
  Flag
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  game: string;
  format: '1v1' | '2v2' | '3v3' | '5v5' | 'battle_royale';
  prizePool: string;
  currency: string;
  startDate: number;
  endDate: number;
  status: 'upcoming' | 'registration' | 'live' | 'completed';
  maxTeams: number;
  registeredTeams: number;
  region: string;
  skillLevel: 'amateur' | 'semi_pro' | 'professional' | 'elite';
  organizer: string;
  rules: string[];
  prizes: {
    position: number;
    amount: string;
    currency: string;
  }[];
}

interface Team {
  id: string;
  name: string;
  tag: string;
  logo: string;
  region: string;
  founded: number;
  roster: Player[];
  achievements: {
    tournament: string;
    position: number;
    date: number;
  }[];
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    averageScore: number;
  };
  earnings: string;
  ranking: number;
}

interface Player {
  id: string;
  name: string;
  ign: string;
  role: 'IGL' | 'Entry' | 'AWP' | 'Support' | 'Lurker' | 'Flex';
  country: string;
  age: number;
  joinDate: number;
  stats: {
    kdRatio: number;
    headshotPercentage: number;
    avgKills: number;
    avgDeaths: number;
    adr: number; // Average Damage per Round
    rating: number;
  };
  earnings: string;
  socials: {
    twitter?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
  };
}

interface BroadcastView {
  id: string;
  name: string;
  type: 'player' | 'free_cam' | 'map' | 'stats' | 'replay';
  playerId?: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraRotation: { x: number; y: number; z: number };
  isActive: boolean;
}

interface MatchData {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  map: string;
  format: string;
  score: { team1: number; team2: number };
  status: 'live' | 'completed' | 'paused';
  startTime: number;
  endTime?: number;
  rounds: {
    number: number;
    winner: 'team1' | 'team2';
    duration: number;
    stats: {
      team1Kills: number;
      team2Kills: number;
      mvp: string;
    };
  }[];
  playerStats: { [playerId: string]: Player['stats'] & { kills: number; deaths: number; assists: number } };
}

interface CoachTools {
  enable: boolean;
  voiceCommunication: boolean;
  screenShare: boolean;
  drawingTools: boolean;
  playerHighlights: boolean;
  strategicOverlays: boolean;
  realTimeStats: boolean;
  matchAnalysis: boolean;
}

interface GLXYESportsProfessionalProps {
  userId: string;
  role: 'player' | 'coach' | 'organizer' | 'spectator' | 'caster';
  tournamentId?: string;
  matchId?: string;
  gameMode: 'battle-royale' | 'fps' | 'racing';
}

export const GLXYESportsProfessional: React.FC<GLXYESportsProfessionalProps> = ({
  userId,
  role,
  tournamentId,
  matchId,
  gameMode
}) => {
  const [activeView, setActiveView] = useState<'tournaments' | 'teams' | 'matches' | 'broadcast' | 'coach' | 'analytics'>('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [broadcastViews, setBroadcastViews] = useState<BroadcastView[]>([
    { id: '1', name: 'Player POV', type: 'player', playerId: 'player1', cameraPosition: { x: 0, y: 0, z: 0 }, cameraRotation: { x: 0, y: 0, z: 0 }, isActive: true },
    { id: '2', name: 'Free Cam', type: 'free_cam', cameraPosition: { x: 100, y: 50, z: 100 }, cameraRotation: { x: 0, y: 0, z: 0 }, isActive: false },
    { id: '3', name: 'Map Overview', type: 'map', cameraPosition: { x: 0, y: 200, z: 0 }, cameraRotation: { x: -90, y: 0, z: 0 }, isActive: false },
    { id: '4', name: 'Statistics', type: 'stats', cameraPosition: { x: 0, y: 0, z: 0 }, cameraRotation: { x: 0, y: 0, z: 0 }, isActive: false }
  ]);

  const [coachTools, setCoachTools] = useState<CoachTools>({
    enable: false,
    voiceCommunication: true,
    screenShare: false,
    drawingTools: true,
    playerHighlights: true,
    strategicOverlays: true,
    realTimeStats: true,
    matchAnalysis: true
  });

  const [broadcastSettings, setBroadcastSettings] = useState({
    isLive: false,
    viewers: 0,
    quality: '1080p',
    bitrate: '6000',
    recording: false,
    streaming: false,
    audioMuted: false,
    videoMuted: false,
    screenShare: false,
    instantReplay: true,
    commentaryEnabled: true
  });

  const [analyticsData, setAnalyticsData] = useState({
    tournamentEngagement: 0,
    viewerRetention: 0,
    peakViewers: 0,
    averageWatchTime: 0,
    socialMediaReach: 0,
    sponsorshipValue: 0,
    playerPerformance: {},
    teamPerformance: {}
  });

  const [coachAnnotations, setCoachAnnotations] = useState<Array<{
    id: string;
    type: 'text' | 'arrow' | 'circle' | 'highlight';
    position: { x: number; y: number };
    content: string;
    timestamp: number;
    author: string;
  }>>([]);

  const [replayClips, setReplayClips] = useState<Array<{
    id: string;
    title: string;
    timestamp: number;
    duration: number;
    type: 'kill' | 'clutch' | 'strategic' | 'highlight';
    players: string[];
  }>>([]);

  // Initialize mock data
  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Mock Tournaments
    const mockTournaments: Tournament[] = [
      {
        id: 't1',
        name: 'GLXY World Championship 2025',
        game: gameMode === 'fps' ? 'Counter-Strike 2' : 'GLXY Battle Royale',
        format: '5v5',
        prizePool: '1,000,000',
        currency: 'USD',
        startDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        status: 'registration',
        maxTeams: 32,
        registeredTeams: 28,
        region: 'Global',
        skillLevel: 'professional',
        organizer: 'GLXY Esports',
        rules: [
          'Best of 3 maps',
          'MR12 format',
          '4 minute round time',
          '40 second bomb timer',
          '2 tactical pauses per team'
        ],
        prizes: [
          { position: 1, amount: '500,000', currency: 'USD' },
          { position: 2, amount: '250,000', currency: 'USD' },
          { position: 3, amount: '125,000', currency: 'USD' },
          { position: 4, amount: '75,000', currency: 'USD' }
        ]
      },
      {
        id: 't2',
        name: 'GLXY Pro League Season 3',
        game: gameMode === 'fps' ? 'Valorant' : 'GLXY Racing',
        format: 'battle_royale',
        prizePool: '250,000',
        currency: 'USD',
        startDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
        status: 'live',
        maxTeams: 20,
        registeredTeams: 20,
        region: 'North America',
        skillLevel: 'semi_pro',
        organizer: 'GLXY Esports',
        rules: [
          'Point system: Placement + Eliminations',
          '3 matches per day',
          'Top 10 qualify for finals',
          'No third-party assistance'
        ],
        prizes: [
          { position: 1, amount: '100,000', currency: 'USD' },
          { position: 2, amount: '60,000', currency: 'USD' },
          { position: 3, amount: '30,000', currency: 'USD' }
        ]
      }
    ];

    setTournaments(mockTournaments);

    // Mock Teams
    const mockTeams: Team[] = [
      {
        id: 'team1',
        name: 'GLXY Titans',
        tag: 'TIT',
        logo: '👑',
        region: 'Europe',
        founded: 2020,
        roster: [
          {
            id: 'p1',
            name: 'John Smith',
            ign: 'TitanKing',
            role: 'IGL',
            country: 'Sweden',
            age: 24,
            joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
            stats: {
              kdRatio: 1.25,
              headshotPercentage: 35.2,
              avgKills: 22.5,
              avgDeaths: 18.0,
              adr: 78.5,
              rating: 1.18
            },
            earnings: '125,000',
            socials: {
              twitter: '@TitanKing',
              twitch: 'titanking',
              youtube: 'TitanKingGaming'
            }
          },
          {
            id: 'p2',
            name: 'Erik Johnson',
            ign: 'SniperElite',
            role: 'AWP',
            country: 'Denmark',
            age: 22,
            joinDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
            stats: {
              kdRatio: 1.45,
              headshotPercentage: 42.8,
              avgKills: 25.3,
              avgDeaths: 17.4,
              adr: 85.2,
              rating: 1.28
            },
            earnings: '85,000',
            socials: {
              twitter: '@SniperElite',
              twitch: 'sniperelite'
            }
          }
        ],
        achievements: [
          { tournament: 'GLXY Championship 2024', position: 1, date: Date.now() - 6 * 30 * 24 * 60 * 60 * 1000 },
          { tournament: 'World Gaming League', position: 2, date: Date.now() - 4 * 30 * 24 * 60 * 60 * 1000 }
        ],
        stats: {
          wins: 45,
          losses: 12,
          winRate: 0.79,
          averageScore: 16.2
        },
        earnings: '450,000',
        ranking: 3
      },
      {
        id: 'team2',
        name: 'Digital Warriors',
        tag: 'DW',
        logo: '⚔️',
        region: 'North America',
        founded: 2019,
        roster: [
          {
            id: 'p3',
            name: 'Mike Chen',
            ign: 'DragonFury',
            role: 'Entry',
            country: 'Canada',
            age: 26,
            joinDate: Date.now() - 730 * 24 * 60 * 60 * 1000,
            stats: {
              kdRatio: 1.18,
              headshotPercentage: 31.5,
              avgKills: 20.8,
              avgDeaths: 17.6,
              adr: 72.3,
              rating: 1.12
            },
            earnings: '95,000',
            socials: {
              twitter: '@DragonFury',
              twitch: 'dragonfury'
            }
          }
        ],
        achievements: [
          { tournament: 'NA Regional Finals', position: 1, date: Date.now() - 2 * 30 * 24 * 60 * 60 * 1000 }
        ],
        stats: {
          wins: 38,
          losses: 15,
          winRate: 0.72,
          averageScore: 15.8
        },
        earnings: '280,000',
        ranking: 7
      }
    ];

    setTeams(mockTeams);

    // Mock Matches
    const mockMatches: MatchData[] = [
      {
        id: 'match1',
        tournamentId: 't2',
        team1: mockTeams[0],
        team2: mockTeams[1],
        map: 'GLXY Arena',
        format: 'Best of 3',
        score: { team1: 2, team2: 1 },
        status: 'completed',
        startTime: Date.now() - 2 * 60 * 60 * 1000,
        endTime: Date.now() - 30 * 60 * 1000,
        rounds: [
          { number: 1, winner: 'team1', duration: 1800000, stats: { team1Kills: 16, team2Kills: 9, mvp: 'TitanKing' } },
          { number: 2, winner: 'team2', duration: 2100000, stats: { team1Kills: 12, team2Kills: 16, mvp: 'DragonFury' } },
          { number: 3, winner: 'team1', duration: 1950000, stats: { team1Kills: 16, team2Kills: 11, mvp: 'SniperElite' } }
        ],
        playerStats: {
          'p1': { kdRatio: 1.3, headshotPercentage: 35, avgKills: 21, avgDeaths: 16, adr: 78, rating: 1.18, kills: 44, deaths: 34, assists: 12 },
          'p2': { kdRatio: 1.5, headshotPercentage: 43, avgKills: 24, avgDeaths: 16, adr: 85, rating: 1.28, kills: 48, deaths: 32, assists: 8 },
          'p3': { kdRatio: 1.2, headshotPercentage: 32, avgKills: 19, avgDeaths: 16, adr: 72, rating: 1.12, kills: 38, deaths: 32, assists: 10 }
        }
      }
    ];

    setMatches(mockMatches);

    // Mock Analytics Data
    setAnalyticsData({
      tournamentEngagement: 78.5,
      viewerRetention: 65.2,
      peakViewers: 125000,
      averageWatchTime: 45,
      socialMediaReach: 2500000,
      sponsorshipValue: 850000,
      playerPerformance: {
        'p1': { impact: 85, consistency: 92, clutch: 78 },
        'p2': { impact: 92, consistency: 88, clutch: 85 }
      },
      teamPerformance: {
        'team1': { teamwork: 88, strategy: 92, execution: 85 },
        'team2': { teamwork: 82, strategy: 78, execution: 80 }
      }
    });

    // Mock Replay Clips
    const mockClips = [
      { id: 'clip1', title: '1v4 Clutch Round 3', timestamp: 1950000, duration: 45000, type: 'clutch' as const, players: ['TitanKing'] },
      { id: 'clip2', title: 'Ace Win Round 1', timestamp: 900000, duration: 30000, type: 'kill' as const, players: ['SniperElite'] },
      { id: 'clip3', title: 'Strategic Rotation', timestamp: 1500000, duration: 20000, type: 'strategic' as const, players: ['team1'] }
    ];

    setReplayClips(mockClips);
  };

  const switchBroadcastView = (viewId: string) => {
    setBroadcastViews(prev => prev.map(view => ({
      ...view,
      isActive: view.id === viewId
    })));
  };

  const toggleBroadcast = () => {
    setBroadcastSettings(prev => ({
      ...prev,
      isLive: !prev.isLive,
      viewers: prev.isLive ? 0 : Math.floor(Math.random() * 50000) + 10000
    }));
  };

  const addCoachAnnotation = (type: any, position: any, content: any) => {
    const newAnnotation = {
      id: Date.now().toString(),
      type,
      position,
      content,
      timestamp: Date.now(),
      author: userId
    };

    setCoachAnnotations(prev => [...prev, newAnnotation]);
  };

  const createReplayClip = (startTimestamp: number, duration: number, title: string, type: any, players: string[]) => {
    const newClip = {
      id: Date.now().toString(),
      title,
      timestamp: startTimestamp,
      duration,
      type,
      players
    };

    setReplayClips(prev => [...prev, newClip]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-600';
      case 'registration': return 'bg-blue-600';
      case 'upcoming': return 'bg-yellow-600';
      case 'completed': return 'bg-green-600';
      case 'paused': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'IGL': return <Crown className="w-4 h-4" />;
      case 'AWP': return <Target className="w-4 h-4" />;
      case 'Entry': return <Zap className="w-4 h-4" />;
      case 'Support': return <Shield className="w-4 h-4" />;
      case 'Lurker': return <Eye className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-yellow-400">GLXY ESPORTS PROFESSIONAL</h1>
          <Badge className="bg-yellow-600">{gameMode.toUpperCase()}</Badge>
          <Badge className="bg-purple-600">{role.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          {role === 'organizer' && (
            <Button className="bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          )}
          {role === 'caster' && (
            <Button
              onClick={toggleBroadcast}
              className={broadcastSettings.isLive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              <Radio className="w-4 h-4 mr-2" />
              {broadcastSettings.isLive ? 'End Broadcast' : 'Go Live'}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-800">
        {[
          { id: 'tournaments', label: 'Tournaments', icon: Trophy },
          { id: 'teams', label: 'Teams', icon: Users },
          { id: 'matches', label: 'Matches', icon: Monitor },
          { id: 'broadcast', label: 'Broadcast', icon: Video },
          { id: 'coach', label: 'Coach Tools', icon: Settings, show: role === 'coach' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, show: role === 'organizer' || role === 'coach' }
        ].filter(tab => !tab.show || tab.show).map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            variant={activeView === tab.id ? 'default' : 'ghost'}
            className={activeView === tab.id ? 'bg-yellow-600' : 'text-gray-400 hover:text-white'}
          >
            {React.createElement(tab.icon, {
                className: "w-4 h-4 mr-2"
              })}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Broadcast Status Bar */}
      {broadcastSettings.isLive && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-400 font-semibold">LIVE</span>
            </div>
            <div className="text-sm text-gray-300">
              <Eye className="w-4 h-4 inline mr-1" />
              {broadcastSettings.viewers.toLocaleString()} viewers
            </div>
            <div className="text-sm text-gray-300">
              Quality: {broadcastSettings.quality}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={broadcastSettings.audioMuted ? "destructive" : "outline"}
              onClick={() => setBroadcastSettings(prev => ({ ...prev, audioMuted: !prev.audioMuted }))}
            >
              {broadcastSettings.audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant={broadcastSettings.videoMuted ? "destructive" : "outline"}
              onClick={() => setBroadcastSettings(prev => ({ ...prev, videoMuted: !prev.videoMuted }))}
            >
              {broadcastSettings.videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant={broadcastSettings.recording ? "destructive" : "outline"}
              onClick={() => setBroadcastSettings(prev => ({ ...prev, recording: !prev.recording }))}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {activeView === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map(tournament => (
            <Card key={tournament.id} className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-yellow-400">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Prize Pool</div>
                    <div className="text-lg font-bold text-white">
                      ${tournament.prizePool} {tournament.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Format</div>
                    <div className="text-lg font-bold text-white">{tournament.format}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Teams</div>
                    <div className="text-lg font-bold text-white">
                      {tournament.registeredTeams}/{tournament.maxTeams}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Skill Level</div>
                    <div className="text-lg font-bold text-white capitalize">{tournament.skillLevel.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Region</div>
                    <div className="text-lg font-bold text-white">{tournament.region}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Start Date</div>
                    <div className="text-lg font-bold text-white">
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Prize Distribution</h4>
                  <div className="space-y-1">
                    {tournament.prizes.map(prize => (
                      <div key={prize.position} className="flex justify-between text-sm">
                        <span className="text-gray-400">#{prize.position} Place:</span>
                        <span className="text-white">${prize.amount} {prize.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => setSelectedTournament(tournament)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {tournament.status === 'registration' && role === 'player' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      Register Team
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Card key={team.id} className="bg-gray-900 border-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{team.logo}</span>
                    <div>
                      <CardTitle className="text-blue-400">{team.name}</CardTitle>
                      <div className="text-sm text-gray-400">{team.tag} • #{team.ranking}</div>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">{team.region}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Win Rate</div>
                    <div className="text-lg font-bold text-white">{(team.stats.winRate * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Average Score</div>
                    <div className="text-lg font-bold text-white">{team.stats.averageScore}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Earnings</div>
                    <div className="text-lg font-bold text-green-400">${team.earnings}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Founded</div>
                    <div className="text-lg font-bold text-white">{team.founded}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Active Roster</h4>
                  <div className="space-y-2">
                    {team.roster.map(player => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(player.role)}
                          <div>
                            <div className="text-sm font-medium text-white">{player.ign}</div>
                            <div className="text-xs text-gray-400">{player.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">Rating: {player.stats.rating.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">K/D: {player.stats.kdRatio.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedTeam(team)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Team Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'matches' && (
        <div className="space-y-6">
          {matches.map(match => (
            <Card key={match.id} className="bg-gray-900 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-white">{match.team1.name}</span>
                    <div className="text-2xl font-bold text-green-400">
                      {match.score.team1} - {match.score.team2}
                    </div>
                    <span className="text-lg font-semibold text-white">{match.team2.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(match.status)}>
                      {match.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-400">{match.map}</span>
                    <span className="text-sm text-gray-400">{match.format}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Team 1 Stats</h4>
                    <div className="space-y-2 text-sm">
                      {match.team1.roster.map(player => {
                        const playerStats = match.playerStats[player.id];
                        return (
                          <div key={player.id} className="flex justify-between">
                            <span className="text-gray-300">{player.ign}</span>
                            <span className="text-white">
                              K:{playerStats?.kills || 0} / D:{playerStats?.deaths || 0} / A:{playerStats?.assists || 0}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-3">Match Rounds</h4>
                    <div className="space-y-2">
                      {match.rounds.map((round, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                          <span className="text-sm text-gray-300">Round {round.number}</span>
                          <span className="text-sm text-white">{round.winner === 'team1' ? match.team1.name : match.team2.name}</span>
                          <span className="text-xs text-gray-400">
                            {Math.floor(round.duration / 60000)}m {Math.floor((round.duration % 60000) / 1000)}s
                          </span>
                          <Badge className="bg-yellow-600 text-xs">MVP: {round.stats.mvp}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-3">Team 2 Stats</h4>
                    <div className="space-y-2 text-sm">
                      {match.team2.roster.map(player => {
                        const playerStats = match.playerStats[player.id];
                        return (
                          <div key={player.id} className="flex justify-between">
                            <span className="text-gray-300">{player.ign}</span>
                            <span className="text-white">
                              K:{playerStats?.kills || 0} / D:{playerStats?.deaths || 0} / A:{playerStats?.assists || 0}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Video className="w-4 h-4 mr-2" />
                    Watch Replay
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download Demo
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main View */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-400">Broadcast View</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBroadcastSettings(prev => ({ ...prev, instantReplay: !prev.instantReplay }))}
                      className={broadcastSettings.instantReplay ? "border-red-600 text-red-400" : "border-gray-600"}
                    >
                      <SkipBack className="w-4 h-4 mr-1" />
                      Replay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBroadcastSettings(prev => ({ ...prev, commentaryEnabled: !prev.commentaryEnabled }))}
                      className={broadcastSettings.commentaryEnabled ? "border-red-600 text-red-400" : "border-gray-600"}
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      Commentary
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-2">
                      {broadcastViews.find(v => v.isActive)?.name || 'No Active View'}
                    </p>
                    {broadcastSettings.isLive && (
                      <Badge className="bg-red-600 mb-4">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE • {broadcastSettings.viewers.toLocaleString()} viewers
                      </Badge>
                    )}
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    {broadcastViews.map(view => (
                      <Button
                        key={view.id}
                        size="sm"
                        onClick={() => switchBroadcastView(view.id)}
                        className={view.isActive ? "bg-red-600" : "bg-gray-700"}
                      >
                        {view.name}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Multi View
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Maximize className="w-4 h-4 mr-1" />
                      Fullscreen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replay Clips */}
            <Card className="bg-gray-900 border-purple-500 mt-6">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <SkipBack className="w-5 h-5" />
                  <span>Instant Replay Clips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {replayClips.map(clip => (
                    <div key={clip.id} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{clip.title}</span>
                        <Badge className="bg-purple-600 text-xs">{clip.type.toUpperCase()}</Badge>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {Math.floor(clip.timestamp / 60000)}:{Math.floor((clip.timestamp % 60000) / 1000).toString().padStart(2, '0')} •
                        {Math.floor(clip.duration / 1000)}s
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600">
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Broadcast Settings */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 text-sm">Broadcast Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Quality</label>
                  <select
                    value={broadcastSettings.quality}
                    onChange={(e) => setBroadcastSettings(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="1440p">1440p</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Bitrate (kbps)</label>
                  <select
                    value={broadcastSettings.bitrate}
                    onChange={(e) => setBroadcastSettings(prev => ({ ...prev, bitrate: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="3000">3000</option>
                    <option value="6000">6000</option>
                    <option value="8000">8000</option>
                    <option value="12000">12000</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={broadcastSettings.streaming}
                      onChange={(e) => setBroadcastSettings(prev => ({ ...prev, streaming: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Enable Streaming</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={broadcastSettings.recording}
                      onChange={(e) => setBroadcastSettings(prev => ({ ...prev, recording: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Enable Recording</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Live Chat */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 text-sm flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Live Chat</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded p-3 overflow-y-auto space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="text-sm">
                      <span className="text-blue-400 font-semibold">User{i}:</span>
                      <span className="text-gray-300 ml-2">Great match! 🔥</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'coach' && role === 'coach' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coach Tools */}
          <Card className="bg-gray-900 border-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Coach Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Voice Communication</span>
                  <input
                    type="checkbox"
                    checked={coachTools.voiceCommunication}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, voiceCommunication: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Screen Share</span>
                  <input
                    type="checkbox"
                    checked={coachTools.screenShare}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, screenShare: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Drawing Tools</span>
                  <input
                    type="checkbox"
                    checked={coachTools.drawingTools}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, drawingTools: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Player Highlights</span>
                  <input
                    type="checkbox"
                    checked={coachTools.playerHighlights}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, playerHighlights: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Strategic Overlays</span>
                  <input
                    type="checkbox"
                    checked={coachTools.strategicOverlays}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, strategicOverlays: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Real-time Stats</span>
                  <input
                    type="checkbox"
                    checked={coachTools.realTimeStats}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, realTimeStats: e.target.checked }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Match Analysis</span>
                  <input
                    type="checkbox"
                    checked={coachTools.matchAnalysis}
                    onChange={(e) => setCoachTools(prev => ({ ...prev, matchAnalysis: e.target.checked }))}
                    className="rounded"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Annotations */}
          <Card className="bg-gray-900 border-blue-500 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Coach Annotations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-800 rounded-lg p-4 overflow-y-auto">
                <div className="space-y-4">
                  {coachAnnotations.map(annotation => (
                    <div key={annotation.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{annotation.author}</span>
                        <Badge className="bg-blue-600 text-xs">{annotation.type.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{annotation.content}</p>
                      <div className="text-xs text-gray-400">
                        Position: ({annotation.position.x}, {annotation.position.y}) •
                        {new Date(annotation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={() => addCoachAnnotation('text', { x: 100, y: 100 }, 'Strategic note here')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Text
                </Button>
                <Button variant="outline" className="border-gray-600">
                  <Target className="w-4 h-4 mr-2" />
                  Draw Arrow
                </Button>
                <Button variant="outline" className="border-gray-600">
                  <Flag className="w-4 h-4 mr-2" />
                  Highlight Area
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card className="bg-gray-900 border-green-500 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Team Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">Teamwork Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Coordination</span>
                      <span className="text-sm text-green-400">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Communication</span>
                      <span className="text-sm text-green-400">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Support Rating</span>
                      <span className="text-sm text-yellow-400">78%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">Strategic Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Map Control</span>
                      <span className="text-sm text-green-400">88%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Economy Management</span>
                      <span className="text-sm text-green-400">91%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Adaptability</span>
                      <span className="text-sm text-yellow-400">75%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">Individual Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Average K/D</span>
                      <span className="text-sm text-green-400">1.24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Headshot %</span>
                      <span className="text-sm text-green-400">35.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Clutch Success</span>
                      <span className="text-sm text-yellow-400">68%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'analytics' && (role === 'organizer' || role === 'coach') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Tournament Engagement */}
          <Card className="bg-gray-900 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-600">+12.5%</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{analyticsData.tournamentEngagement}%</div>
              <div className="text-sm text-gray-400">Tournament Engagement</div>
            </CardContent>
          </Card>

          {/* Viewer Retention */}
          <Card className="bg-gray-900 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-600">+8.3%</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{analyticsData.viewerRetention}%</div>
              <div className="text-sm text-gray-400">Viewer Retention</div>
            </CardContent>
          </Card>

          {/* Peak Viewers */}
          <Card className="bg-gray-900 border-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Eye className="w-8 h-8 text-red-500" />
                <Badge className="bg-red-600">+25.8%</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{analyticsData.peakViewers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Peak Viewers</div>
            </CardContent>
          </Card>

          {/* Sponsorship Value */}
          <Card className="bg-gray-900 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-600">+18.2%</Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">${analyticsData.sponsorshipValue.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Sponsorship Value</div>
            </CardContent>
          </Card>

          {/* Detailed Analytics */}
          <Card className="bg-gray-900 border-orange-500 lg:col-span-2 xl:col-span-4">
            <CardHeader>
              <CardTitle className="text-orange-400">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Player Performance</h4>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.playerPerformance).map(([playerId, stats]: [string, any]) => (
                      <div key={playerId} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">Player {playerId}</span>
                          <Badge className="bg-blue-600">Active</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-400">Impact</div>
                            <div className="text-white">{stats.impact}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Consistency</div>
                            <div className="text-white">{stats.consistency}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Clutch</div>
                            <div className="text-white">{stats.clutch}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">Team Performance</h4>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.teamPerformance).map(([teamId, stats]: [string, any]) => (
                      <div key={teamId} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">Team {teamId}</span>
                          <Badge className="bg-green-600">Ranked #3</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-400">Teamwork</div>
                            <div className="text-white">{stats.teamwork}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Strategy</div>
                            <div className="text-white">{stats.strategy}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Execution</div>
                            <div className="text-white">{stats.execution}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};