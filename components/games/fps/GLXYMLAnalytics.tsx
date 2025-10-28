// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  Shield,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Star,
  Award,
  Clock,
  MapPin
} from 'lucide-react';

interface PlayerBehaviorData {
  playerId: string;
  movementPatterns: {
    positions: { x: number; y: number; z: number; timestamp: number }[];
    averageSpeed: number;
    preferredAreas: string[];
    campingTendencies: number;
    aggressionLevel: number;
  };
  combatStats: {
    accuracy: number;
    reactionTime: number;
    killDeathRatio: number;
    headshotPercentage: number;
    weaponPreferences: { weapon: string; usage: number }[];
  };
  socialInteractions: {
    teamworkScore: number;
    communicationFrequency: number;
    leadershipTendencies: number;
    toxicityScore: number;
  };
}

interface MLPrediction {
  type: 'matchmaking' | 'retention' | 'performance' | 'behavior';
  confidence: number;
  prediction: any;
  timestamp: number;
  impact: 'high' | 'medium' | 'low';
}

interface AntiCheatDetection {
  playerId: string;
  suspiciousActivities: {
    aimAssistance: number;
    wallHacking: number;
    speedHacking: number;
    abnormalMovement: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: number;
  reviewed: boolean;
}

interface MatchmakingProfile {
  playerId: string;
  skillRating: number;
  volatility: number;
  recentPerformance: {
    wins: number;
    losses: number;
    kdRatio: number;
    averageScore: number;
  };
  playStyle: {
    aggressive: number;
    defensive: number;
    supportive: number;
    strategic: number;
  };
  preferredGameModes: string[];
  availabilitySchedule: { day: number; hours: number[] }[];
}

interface GLXYMLAnalyticsProps {
  gameId: string;
  playerId: string;
  gameMode: 'battle-royale' | 'fps' | 'racing';
  onInsightGenerated?: (insight: MLPrediction) => void;
  onAntiCheatAlert?: (alert: AntiCheatDetection) => void;
}

export const GLXYMLAnalytics: React.FC<GLXYMLAnalyticsProps> = ({
  gameId,
  playerId,
  gameMode,
  onInsightGenerated,
  onAntiCheatAlert
}) => {
  const [isMLActive, setIsMLActive] = useState(false);
  const [behaviorData, setBehaviorData] = useState<PlayerBehaviorData | null>(null);
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [antiCheatAlerts, setAntiCheatAlerts] = useState<AntiCheatDetection[]>([]);
  const [matchmakingProfiles, setMatchmakingProfiles] = useState<MatchmakingProfile[]>([]);

  const [analyticsSettings, setAnalyticsSettings] = useState({
    trackPlayerBehavior: true,
    enableMatchmakingML: true,
    enableAntiCheatML: true,
    predictPlayerRetention: true,
    analyzeGameBalance: true,
    generateInsights: true,
    dataRetentionDays: 90
  });

  const [performanceMetrics, setPerformanceMetrics] = useState({
    modelAccuracy: 0.94,
    processingSpeed: 12, // ms
    predictionsPerMinute: 150,
    falsePositiveRate: 0.02,
    dataPointsAnalyzed: 1250000,
    modelsTrained: 12
  });

  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<MLPrediction | null>(null);

  // Simulate ML data collection
  useEffect(() => {
    if (!isMLActive) return;

    const collectBehaviorData = setInterval(() => {
      const mockBehaviorData: PlayerBehaviorData = {
        playerId,
        movementPatterns: {
          positions: generateMockPositions(100),
          averageSpeed: Math.random() * 8 + 2,
          preferredAreas: ['spawn_point', 'center_area', 'high_ground'],
          campingTendencies: Math.random() * 0.8,
          aggressionLevel: Math.random() * 0.9 + 0.1
        },
        combatStats: {
          accuracy: Math.random() * 0.4 + 0.3,
          reactionTime: Math.random() * 300 + 150,
          killDeathRatio: Math.random() * 2.5 + 0.5,
          headshotPercentage: Math.random() * 0.3 + 0.1,
          weaponPreferences: [
            { weapon: 'GLXY M4A1', usage: Math.random() * 0.4 + 0.2 },
            { weapon: 'GLXY Quantum Rifle', usage: Math.random() * 0.3 + 0.1 },
            { weapon: 'GLXY Sniper', usage: Math.random() * 0.2 + 0.1 }
          ]
        },
        socialInteractions: {
          teamworkScore: Math.random() * 0.8 + 0.2,
          communicationFrequency: Math.random() * 10 + 2,
          leadershipTendencies: Math.random() * 0.7 + 0.1,
          toxicityScore: Math.random() * 0.3
        }
      };

      setBehaviorData(mockBehaviorData);

      // Generate predictions
      generateMLPredictions(mockBehaviorData);

      // Check for anti-cheat patterns
      checkAntiCheatPatterns(mockBehaviorData);

    }, 5000); // Update every 5 seconds

    return () => clearInterval(collectBehaviorData);
  }, [isMLActive, playerId]);

  // Generate mock position data
  const generateMockPositions = (count: number) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.random() * 1000 - 500,
        y: Math.random() * 100,
        z: Math.random() * 1000 - 500,
        timestamp: Date.now() - (count - i) * 1000
      });
    }
    return positions;
  };

  // Generate ML predictions
  const generateMLPredictions = (data: PlayerBehaviorData) => {
    const newPredictions: MLPrediction[] = [];

    // Matchmaking prediction
    if (analyticsSettings.enableMatchmakingML) {
      const matchmakingPred: MLPrediction = {
        type: 'matchmaking',
        confidence: 0.87,
        prediction: {
          estimatedWaitTime: Math.floor(Math.random() * 120 + 30),
          predictedOpponentSkill: Math.floor(data.combatStats.killDeathRatio * 1000),
          matchQualityScore: Math.random() * 0.3 + 0.7,
          recommendedGameMode: getPreferredGameMode(data)
        },
        timestamp: Date.now(),
        impact: 'high'
      };
      newPredictions.push(matchmakingPred);
    }

    // Retention prediction
    if (analyticsSettings.predictPlayerRetention) {
      const retentionPred: MLPrediction = {
        type: 'retention',
        confidence: 0.91,
        prediction: {
          retentionProbability: calculateRetentionProbability(data),
          churnRisk: calculateChurnRisk(data),
          recommendedIntervention: getRecommendedIntervention(data),
          expectedLifetime: Math.floor(Math.random() * 180 + 30) // days
        },
        timestamp: Date.now(),
        impact: 'high'
      };
      newPredictions.push(retentionPred);
    }

    // Performance prediction
    const performancePred: MLPrediction = {
      type: 'performance',
      confidence: 0.84,
      prediction: {
        expectedKDRatio: predictFutureKDRatio(data),
        improvementPotential: calculateImprovementPotential(data),
        skillCeiling: calculateSkillCeiling(data),
        recommendedTrainingFocus: getTrainingFocus(data)
      },
      timestamp: Date.now(),
      impact: 'medium'
    };
    newPredictions.push(performancePred);

    // Behavior prediction
    const behaviorPred: MLPrediction = {
      type: 'behavior',
      confidence: 0.78,
      prediction: {
        likelyActions: ['aggressive_push', 'flank_maneuver', 'strategic_retreat'],
        emotionalState: predictEmotionalState(data),
        frustrationLevel: calculateFrustrationLevel(data),
        engagementScore: calculateEngagementScore(data)
      },
      timestamp: Date.now(),
      impact: 'medium'
    };
    newPredictions.push(behaviorPred);

    setPredictions(prev => [...newPredictions, ...prev].slice(0, 20));

    // Trigger callback for high-impact predictions
    newPredictions.forEach(pred => {
      if (pred.confidence > 0.8 && pred.impact === 'high') {
        onInsightGenerated?.(pred);
      }
    });
  };

  // Anti-cheat detection
  const checkAntiCheatPatterns = (data: PlayerBehaviorData) => {
    if (!analyticsSettings.enableAntiCheatML) return;

    const suspiciousActivities = {
      aimAssistance: Math.random() * 0.2, // Low chance for legit players
      wallHacking: Math.random() * 0.15,
      speedHacking: Math.random() * 0.1,
      abnormalMovement: Math.random() * 0.25
    };

    const riskScore = Object.values(suspiciousActivities).reduce((a, b) => a + b, 0) / 4;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (riskScore > 0.7) riskLevel = 'critical';
    else if (riskScore > 0.5) riskLevel = 'high';
    else if (riskScore > 0.3) riskLevel = 'medium';

    if (riskLevel !== 'low') {
      const alert: AntiCheatDetection = {
        playerId,
        suspiciousActivities,
        riskLevel,
        detectedAt: Date.now(),
        reviewed: false
      };

      setAntiCheatAlerts(prev => [alert, ...prev].slice(0, 50));
      onAntiCheatAlert?.(alert);
    }
  };

  // ML Helper Functions
  const getPreferredGameMode = (data: PlayerBehaviorData) => {
    if (data.movementPatterns.aggressionLevel > 0.7) return 'deathmatch';
    if (data.socialInteractions.teamworkScore > 0.7) return 'team_tactical';
    return 'battle_royale';
  };

  const calculateRetentionProbability = (data: PlayerBehaviorData) => {
    const baseRetention = 0.7;
    const engagementBonus = data.socialInteractions.communicationFrequency * 0.02;
    const performanceBonus = data.combatStats.killDeathRatio * 0.1;
    const teamworkBonus = data.socialInteractions.teamworkScore * 0.15;

    return Math.min(0.95, baseRetention + engagementBonus + performanceBonus + teamworkBonus);
  };

  const calculateChurnRisk = (data: PlayerBehaviorData) => {
    const frustration = calculateFrustrationLevel(data);
    const toxicity = data.socialInteractions.toxicityScore;
    const performance = data.combatStats.killDeathRatio;

    return Math.min(0.9, frustration * 0.4 + toxicity * 0.3 + (1 / performance) * 0.3);
  };

  const getRecommendedIntervention = (data: PlayerBehaviorData) => {
    const churnRisk = calculateChurnRisk(data);
    if (churnRisk > 0.7) return 'immediate_support';
    if (data.socialInteractions.teamworkScore < 0.3) return 'team_training';
    if (data.combatStats.accuracy < 0.2) return 'aim_training';
    return 'regular_engagement';
  };

  const predictFutureKDRatio = (data: PlayerBehaviorData) => {
    const currentKDR = data.combatStats.killDeathRatio;
    const improvement = calculateImprovementPotential(data);
    return Math.min(3.0, currentKDR + improvement);
  };

  const calculateImprovementPotential = (data: PlayerBehaviorData) => {
    const accuracyImprovement = (0.8 - data.combatStats.accuracy) * 0.5;
    const reactionImprovement = (500 - data.combatStats.reactionTime) * 0.001;
    return accuracyImprovement + reactionImprovement;
  };

  const calculateSkillCeiling = (data: PlayerBehaviorData) => {
    const baseCeiling = 2.5;
    const naturalTalent = data.combatStats.accuracy * 2;
    const learningAbility = data.socialInteractions.teamworkScore * 0.5;
    return baseCeiling + naturalTalent + learningAbility;
  };

  const getTrainingFocus = (data: PlayerBehaviorData) => {
    const weaknesses = [];
    if (data.combatStats.accuracy < 0.3) weaknesses.push('aim_training');
    if (data.combatStats.reactionTime > 300) weaknesses.push('reaction_training');
    if (data.movementPatterns.campingTendencies > 0.6) weaknesses.push('movement_training');
    if (data.socialInteractions.teamworkScore < 0.4) weaknesses.push('teamwork_training');
    return weaknesses.length > 0 ? weaknesses : ['advanced_strategies'];
  };

  const predictEmotionalState = (data: PlayerBehaviorData) => {
    const frustration = calculateFrustrationLevel(data);
    const engagement = calculateEngagementScore(data);

    if (frustration > 0.7) return 'frustrated';
    if (engagement > 0.8) return 'highly_engaged';
    if (data.combatStats.killDeathRatio > 2.0) return 'confident';
    return 'neutral';
  };

  const calculateFrustrationLevel = (data: PlayerBehaviorData) => {
    const performanceFactor = Math.max(0, (1 - data.combatStats.killDeathRatio) * 0.4);
    const deathFactor = Math.max(0, (1 - data.combatStats.accuracy) * 0.3);
    const toxicityFactor = data.socialInteractions.toxicityScore * 0.3;
    return performanceFactor + deathFactor + toxicityFactor;
  };

  const calculateEngagementScore = (data: PlayerBehaviorData) => {
    const communicationFactor = Math.min(1, data.socialInteractions.communicationFrequency * 0.05);
    const movementFactor = Math.min(1, data.movementPatterns.averageSpeed * 0.1);
    const combatFactor = Math.min(1, data.combatStats.killDeathRatio * 0.3);
    return communicationFactor + movementFactor + combatFactor;
  };

  // Generate matchmaking profile
  const generateMatchmakingProfile = useCallback((playerData: PlayerBehaviorData): MatchmakingProfile => {
    return {
      playerId: playerData.playerId,
      skillRating: Math.floor(playerData.combatStats.killDeathRatio * 1000 +
                     playerData.combatStats.accuracy * 500 +
                     playerData.socialInteractions.teamworkScore * 300),
      volatility: Math.random() * 100 + 50,
      recentPerformance: {
        wins: Math.floor(Math.random() * 10 + 5),
        losses: Math.floor(Math.random() * 8 + 3),
        kdRatio: playerData.combatStats.killDeathRatio,
        averageScore: Math.floor(playerData.combatStats.killDeathRatio * 2000 + Math.random() * 500)
      },
      playStyle: {
        aggressive: playerData.movementPatterns.aggressionLevel,
        defensive: 1 - playerData.movementPatterns.aggressionLevel,
        supportive: playerData.socialInteractions.teamworkScore,
        strategic: Math.random() * 0.8 + 0.2
      },
      preferredGameModes: [getPreferredGameMode(playerData)],
      availabilitySchedule: [
        { day: 1, hours: [18, 19, 20, 21, 22] },
        { day: 6, hours: [14, 15, 16, 17, 18, 19, 20, 21, 22] },
        { day: 0, hours: [14, 15, 16, 17, 18, 19, 20, 21, 22] }
      ]
    };
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-purple-400">GLXY ML ANALYTICS</h1>
          <Badge className="bg-purple-600">{gameMode.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsMLActive(!isMLActive)}
            className={isMLActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
          >
            {isMLActive ? <Activity className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isMLActive ? 'ML Active' : 'Start ML'}
          </Button>
          <Button
            onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
            variant="outline"
            className="border-purple-500 text-purple-400"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showDetailedAnalytics ? 'Simple View' : 'Detailed Analytics'}
          </Button>
        </div>
      </div>

      {isMLActive && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{(performanceMetrics.modelAccuracy * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Model Accuracy</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{performanceMetrics.processingSpeed}ms</div>
                <div className="text-xs text-gray-400">Processing Speed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{performanceMetrics.predictionsPerMinute}</div>
                <div className="text-xs text-gray-400">Predictions/Min</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{(performanceMetrics.falsePositiveRate * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-400">False Positive Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{(performanceMetrics.dataPointsAnalyzed / 1000000).toFixed(1)}M</div>
                <div className="text-xs text-gray-400">Data Points Analyzed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{performanceMetrics.modelsTrained}</div>
                <div className="text-xs text-gray-400">Models Trained</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ML Predictions */}
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>ML Predictions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {predictions.slice(0, 10).map((prediction, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => setSelectedPrediction(prediction)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-600 text-xs">
                          {prediction.type.replace('_', ' ')}
                        </Badge>
                        <span className={`text-xs font-semibold ${getImpactColor(prediction.impact)}`}>
                          {prediction.impact.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">
                          Confidence: {(prediction.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(prediction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {showDetailedAnalytics && (
                        <div className="mt-2 text-xs text-gray-400">
                          {JSON.stringify(prediction.prediction, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anti-Cheat Alerts */}
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Anti-Cheat Detections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {antiCheatAlerts.length > 0 ? (
                    antiCheatAlerts.slice(0, 10).map((alert, index) => (
                      <div key={index} className="p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white">
                            Player: {alert.playerId.slice(-8)}
                          </span>
                          <Badge className={getRiskColor(alert.riskLevel)}>
                            {alert.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Aim Assistance:</span>
                            <span className="text-yellow-400">{(alert.suspiciousActivities.aimAssistance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wall Hacking:</span>
                            <span className="text-yellow-400">{(alert.suspiciousActivities.wallHacking * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Speed Hacking:</span>
                            <span className="text-yellow-400">{(alert.suspiciousActivities.speedHacking * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Abnormal Movement:</span>
                            <span className="text-yellow-400">{(alert.suspiciousActivities.abnormalMovement * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {new Date(alert.detectedAt).toLocaleTimeString()}
                          </span>
                          {!alert.reviewed && (
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No suspicious activity detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Player Behavior Analysis */}
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Behavior Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorData ? (
                  <div className="space-y-4">
                    {/* Movement Patterns */}
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Movement Patterns</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Speed:</span>
                          <span className="text-white">{behaviorData.movementPatterns.averageSpeed.toFixed(1)} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Aggression Level:</span>
                          <span className="text-white">{(behaviorData.movementPatterns.aggressionLevel * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Camping Tendency:</span>
                          <span className="text-white">{(behaviorData.movementPatterns.campingTendencies * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Combat Stats */}
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Combat Performance</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Accuracy:</span>
                          <span className="text-white">{(behaviorData.combatStats.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reaction Time:</span>
                          <span className="text-white">{behaviorData.combatStats.reactionTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">K/D Ratio:</span>
                          <span className="text-white">{behaviorData.combatStats.killDeathRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Headshot %:</span>
                          <span className="text-white">{(behaviorData.combatStats.headshotPercentage * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Interactions */}
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Social Behavior</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Teamwork Score:</span>
                          <span className="text-white">{(behaviorData.socialInteractions.teamworkScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Communication:</span>
                          <span className="text-white">{behaviorData.socialInteractions.communicationFrequency.toFixed(1)}/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Leadership:</span>
                          <span className="text-white">{(behaviorData.socialInteractions.leadershipTendencies * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Toxicity Score:</span>
                          <span className={behaviorData.socialInteractions.toxicityScore > 0.5 ? "text-red-400" : "text-green-400"}>
                            {(behaviorData.socialInteractions.toxicityScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="p-3 bg-purple-900/30 rounded-lg">
                      <h4 className="text-purple-400 font-semibold mb-2 text-sm">AI Insights</h4>
                      <div className="space-y-1 text-xs text-gray-300">
                        <p>• {predictEmotionalState(behaviorData) === 'highly_engaged' ? 'Highly engaged player' : 'Moderate engagement detected'}</p>
                        <p>• {calculateRetentionProbability(behaviorData) > 0.8 ? 'High retention probability' : 'Monitor for churn risk'}</p>
                        <p>• {calculateImprovementPotential(behaviorData) > 0.5 ? 'Significant improvement potential' : 'Near skill ceiling'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p>Analyzing player behavior...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Prediction Detail */}
          {selectedPrediction && (
            <Card className="bg-gray-900 border-purple-500 mt-6">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center justify-between">
                  <span>Prediction Details</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPrediction(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Prediction Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <Badge className="bg-purple-600">{selectedPrediction.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-white">{(selectedPrediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Impact:</span>
                        <span className={`font-semibold ${getImpactColor(selectedPrediction.impact)}`}>
                          {selectedPrediction.impact.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Timestamp:</span>
                        <span className="text-white">{new Date(selectedPrediction.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3">Prediction Data</h4>
                    <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedPrediction.prediction, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isMLActive && (
        <div className="text-center py-16">
          <Brain className="w-24 h-24 mx-auto mb-4 text-gray-600 opacity-50" />
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">ML Analytics Inactive</h2>
          <p className="text-gray-500 mb-6">Start the ML engine to begin analyzing player behavior and generating insights</p>
          <Button
            onClick={() => setIsMLActive(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start ML Analytics
          </Button>
        </div>
      )}
    </div>
  );
};