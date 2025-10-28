// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Clock,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Award,
  ShoppingCart,
  Zap,
  Download,
  Upload,
  Calendar,
  Trophy,
  Filter,
  RefreshCw,
  Settings,
  Monitor,
  ArrowUp,
  ArrowDown,
  Minus,
  Smartphone,
  Globe,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Timer,
  Star,
  Heart,
  MessageSquare,
  Share2,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  unit: string;
  target?: number;
  status: 'good' | 'warning' | 'critical' | 'normal';
  description: string;
}

interface PlayerEngagement {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionTime: number;
  retentionRate: number;
  churnRate: number;
  newPlayers: number;
  returningPlayers: number;
  peakConcurrentUsers: number;
}

interface GamePerformance {
  averageFPS: number;
  frameTime: number;
  renderTime: number;
  networkLatency: number;
  serverResponseTime: number;
  crashRate: number;
  errorRate: number;
  loadingTime: number;
}

interface MonetizationMetrics {
  totalRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  purchaseFrequency: number;
  topSellingItems: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueBySource: {
    inGame: number;
    marketplace: number;
    subscriptions: number;
    tournaments: number;
  };
}

interface GeographicData {
  region: string;
  country: string;
  city: string;
  players: number;
  averagePing: number;
  revenue: number;
  growthRate: number;
}

interface HeatMapData {
  x: number;
  y: number;
  intensity: number;
  label: string;
  type: 'kill' | 'death' | 'pickup' | 'objective';
}

interface PlayerJourney {
  playerId: string;
  journey: Array<{
    timestamp: number;
    action: string;
    duration: number;
    metadata: any;
  }>;
  totalJourneyTime: number;
  conversionPoints: string[];
  dropOffPoints: string[];
}

interface ABRTestResult {
  testId: string;
  testName: string;
  variants: Array<{
    name: string;
    conversionRate: number;
    users: number;
    revenue: number;
  }>;
  winner: string;
  confidence: number;
  status: 'running' | 'completed' | 'paused';
  startDate: number;
  endDate?: number;
}

interface GLXYAnalyticsDashboardProps {
  gameId: string;
  userId: string;
  role: 'admin' | 'developer' | 'analyst' | 'viewer';
  dateRange: { start: Date; end: Date };
  onExportData?: (data: any) => void;
}

export const GLXYAnalyticsDashboard: React.FC<GLXYAnalyticsDashboardProps> = ({
  gameId,
  userId,
  role,
  dateRange,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'performance' | 'monetization' | 'geographic' | 'behavior' | 'testing'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | '90d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetric[]>([]);
  const [playerEngagement, setPlayerEngagement] = useState<PlayerEngagement | null>(null);
  const [gamePerformance, setGamePerformance] = useState<GamePerformance | null>(null);
  const [monetizationMetrics, setMonetizationMetrics] = useState<MonetizationMetrics | null>(null);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [playerJourneys, setPlayerJourneys] = useState<PlayerJourney[]>([]);
  const [abrTestResults, setAbrTestResults] = useState<ABRTestResult[]>([]);

  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize mock data
  useEffect(() => {
    initializeAnalyticsData();
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined
  }, [selectedTimeRange, autoRefresh]);

  const initializeAnalyticsData = () => {
    // Mock analytics metrics
    const mockMetrics: AnalyticsMetric[] = [
      {
        id: 'dau',
        name: 'Daily Active Users',
        value: 45678,
        change: 12.5,
        changeType: 'increase',
        unit: 'users',
        target: 50000,
        status: 'good',
        description: 'Players who logged in today'
      },
      {
        id: 'session_time',
        name: 'Average Session Time',
        value: 47.3,
        change: -3.2,
        changeType: 'decrease',
        unit: 'minutes',
        target: 60,
        status: 'warning',
        description: 'Average time spent per session'
      },
      {
        id: 'retention',
        name: 'Day 7 Retention',
        value: 68.4,
        change: 5.1,
        changeType: 'increase',
        unit: '%',
        target: 70,
        status: 'good',
        description: 'Players returning after 7 days'
      },
      {
        id: 'revenue',
        name: 'Daily Revenue',
        value: 84750,
        change: 18.7,
        changeType: 'increase',
        unit: '$',
        target: 100000,
        status: 'normal',
        description: 'Total revenue generated today'
      },
      {
        id: 'conversion',
        name: 'Conversion Rate',
        value: 3.8,
        change: 0.5,
        changeType: 'increase',
        unit: '%',
        target: 5,
        status: 'normal',
        description: 'Free to paid conversion rate'
      },
      {
        id: 'crash_rate',
        name: 'Crash Rate',
        value: 0.12,
        change: -0.08,
        changeType: 'decrease',
        unit: '%',
        target: 0.1,
        status: 'good',
        description: 'Percentage of sessions ending in crash'
      }
    ];

    setAnalyticsMetrics(mockMetrics);

    // Mock player engagement data
    const mockEngagement: PlayerEngagement = {
      dailyActiveUsers: 45678,
      monthlyActiveUsers: 125000,
      averageSessionTime: 47.3,
      retentionRate: 68.4,
      churnRate: 4.2,
      newPlayers: 3456,
      returningPlayers: 42222,
      peakConcurrentUsers: 12500
    };

    setPlayerEngagement(mockEngagement);

    // Mock game performance data
    const mockPerformance: GamePerformance = {
      averageFPS: 87.5,
      frameTime: 11.4,
      renderTime: 8.2,
      networkLatency: 45,
      serverResponseTime: 67,
      crashRate: 0.12,
      errorRate: 0.03,
      loadingTime: 3.8
    };

    setGamePerformance(mockPerformance);

    // Mock monetization data
    const mockMonetization: MonetizationMetrics = {
      totalRevenue: 84750,
      averageRevenuePerUser: 1.85,
      conversionRate: 3.8,
      purchaseFrequency: 2.4,
      topSellingItems: [
        { name: 'GLXY Battle Pass', sales: 1234, revenue: 36750 },
        { name: 'Weapon Skin Pack', sales: 2345, revenue: 23450 },
        { name: 'Character Cosmetics', sales: 3456, revenue: 24550 }
      ],
      revenueBySource: {
        inGame: 45000,
        marketplace: 28750,
        subscriptions: 8000,
        tournaments: 3000
      }
    };

    setMonetizationMetrics(mockMonetization);

    // Mock geographic data
    const mockGeographic: GeographicData[] = [
      { region: 'North America', country: 'United States', city: 'New York', players: 15000, averagePing: 25, revenue: 35000, growthRate: 12.5 },
      { region: 'Europe', country: 'Germany', city: 'Berlin', players: 12000, averagePing: 35, revenue: 28000, growthRate: 8.3 },
      { region: 'Asia', country: 'Japan', city: 'Tokyo', players: 10000, averagePing: 45, revenue: 15000, growthRate: 15.7 },
      { region: 'South America', country: 'Brazil', city: 'São Paulo', players: 5678, averagePing: 65, revenue: 5000, growthRate: 22.1 }
    ];

    setGeographicData(mockGeographic);

    // Mock heatmap data
    const mockHeatMap: HeatMapData[] = [
      { x: 250, y: 300, intensity: 85, label: 'Drop Zone A', type: 'pickup' },
      { x: 500, y: 200, intensity: 92, label: 'Central Area', type: 'kill' },
      { x: 150, y: 450, intensity: 78, label: 'Sniper Tower', type: 'death' },
      { x: 750, y: 380, intensity: 65, label: 'Resource Point', type: 'pickup' },
      { x: 400, y: 150, intensity: 88, label: 'Objective Alpha', type: 'objective' }
    ];

    setHeatMapData(mockHeatMap);

    // Mock A/B test results
    const mockABTests: ABRTestResult[] = [
      {
        testId: 'test1',
        testName: 'Main Menu Layout',
        variants: [
          { name: 'Control', conversionRate: 3.2, users: 5000, revenue: 4500 },
          { name: 'Variant A', conversionRate: 3.8, users: 5000, revenue: 5200 },
          { name: 'Variant B', conversionRate: 3.5, users: 5000, revenue: 4800 }
        ],
        winner: 'Variant A',
        confidence: 95.2,
        status: 'completed',
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now()
      },
      {
        testId: 'test2',
        testName: 'Battle Pass Pricing',
        variants: [
          { name: '$9.99', conversionRate: 2.8, users: 3000, revenue: 840 },
          { name: '$12.99', conversionRate: 2.1, users: 3000, revenue: 820 }
        ],
        winner: '$9.99',
        confidence: 87.3,
        status: 'running',
        startDate: Date.now() - 3 * 24 * 60 * 60 * 1000
      }
    ];

    setAbrTestResults(mockABTests);
    return;
  };

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      initializeAnalyticsData();
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    const data = {
      metrics: analyticsMetrics,
      engagement: playerEngagement,
      performance: gamePerformance,
      monetization: monetizationMetrics,
      geographic: geographicData,
      timestamp: Date.now(),
      dateRange: selectedTimeRange
    };

    onExportData?.(data);

    // Simulate file download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glxy_analytics_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricIcon = (metricId: string) => {
    switch (metricId) {
      case 'dau': return <Users className="w-5 h-5" />;
      case 'session_time': return <Clock className="w-5 h-5" />;
      case 'retention': return <Heart className="w-5 h-5" />;
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'conversion': return <Target className="w-5 h-5" />;
      case 'crash_rate': return <AlertTriangle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      case 'normal': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'decrease': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-orange-400">GLXY ANALYTICS DASHBOARD</h1>
          <Badge className="bg-orange-600">{role.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Auto Refresh</span>
          </label>

          {/* Actions */}
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-600"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-gray-600"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={() => exportData('json')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'engagement', label: 'Engagement', icon: Users },
          { id: 'performance', label: 'Performance', icon: Monitor },
          { id: 'monetization', label: 'Monetization', icon: DollarSign },
          { id: 'geographic', label: 'Geographic', icon: Globe },
          { id: 'behavior', label: 'Behavior', icon: MousePointer },
          { id: 'testing', label: 'A/B Testing', icon: Activity }
        ].map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={activeTab === tab.id ? 'bg-orange-600' : 'text-gray-400 hover:text-white'}
          >
            {React.createElement(tab.icon, {
                className: "w-4 h-4 mr-2"
              })}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {analyticsMetrics.map(metric => (
              <Card key={metric.id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ${getStatusColor(metric.status)}`}>
                      {getMetricIcon(metric.id)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(metric.changeType)}
                      <span className={`text-sm font-medium ${
                        metric.changeType === 'increase' ? 'text-green-500' :
                        metric.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {metric.value.toLocaleString()}{metric.unit}
                  </div>
                  <div className="text-sm text-gray-400">{metric.name}</div>
                  {metric.target && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Target</span>
                        <span>{metric.target.toLocaleString()}{metric.unit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            metric.value >= metric.target ? 'bg-green-500' :
                            metric.value >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>User Growth</span>
                  </span>
                  <Badge className="bg-green-600">+12.5%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">User growth over time</p>
                    <p className="text-sm text-gray-500">45,678 DAU</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Revenue Breakdown</span>
                  </span>
                  <Badge className="bg-blue-600">$84,750</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">Revenue by source</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">In-Game:</span>
                        <span className="text-white">$45,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Marketplace:</span>
                        <span className="text-white">$28,750</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subscriptions:</span>
                        <span className="text-white">$8,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Distribution */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Platform Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">PC</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-sm text-white">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Mobile</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }} />
                      </div>
                      <span className="text-sm text-white">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Console</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }} />
                      </div>
                      <span className="text-sm text-white">20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Performance */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Server Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gamePerformance && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Avg FPS</span>
                      <span className={`text-sm font-medium ${
                        gamePerformance.averageFPS >= 60 ? 'text-green-400' :
                        gamePerformance.averageFPS >= 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {gamePerformance.averageFPS.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Latency</span>
                      <span className={`text-sm font-medium ${
                        gamePerformance.networkLatency < 50 ? 'text-green-400' :
                        gamePerformance.networkLatency < 100 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {gamePerformance.networkLatency}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Crash Rate</span>
                      <span className={`text-sm font-medium ${
                        gamePerformance.crashRate < 0.1 ? 'text-green-400' :
                        gamePerformance.crashRate < 0.5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {gamePerformance.crashRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Load Time</span>
                      <span className="text-sm font-medium text-white">
                        {gamePerformance.loadingTime}s
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400 flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm text-white">New peak concurrent users</div>
                      <div className="text-xs text-gray-400">12,500 users • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm text-white">Server maintenance completed</div>
                      <div className="text-xs text-gray-400">NA-East • 5 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm text-white">New feature deployed</div>
                      <div className="text-xs text-gray-400">Battle Pass v2.1 • 1 day ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && playerEngagement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-400">Player Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-400">{playerEngagement.dailyActiveUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Daily Active Users</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-green-400">{playerEngagement.monthlyActiveUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Monthly Active Users</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{playerEngagement.averageSessionTime.toFixed(1)} min</div>
                  <div className="text-sm text-gray-400">Avg Session Time</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-purple-400">{playerEngagement.retentionRate}%</div>
                  <div className="text-sm text-gray-400">Day 7 Retention</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-red-400">{playerEngagement.churnRate}%</div>
                  <div className="text-sm text-gray-400">Churn Rate</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-orange-400">{playerEngagement.peakConcurrentUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Peak Concurrent</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-400">Player Acquisition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">New Players Today</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">{playerEngagement.newPlayers.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Returning Players</span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">{playerEngagement.returningPlayers.toLocaleString()}</div>
                </div>
                <div className="h-32 bg-gray-800 rounded flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'monetization' && monetizationMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white">${monetizationMetrics.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-blue-500" />
                  <ArrowUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white">{monetizationMetrics.conversionRate}%</div>
                <div className="text-sm text-gray-400">Conversion Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-500" />
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-white">${monetizationMetrics.averageRevenuePerUser.toFixed(2)}</div>
                <div className="text-sm text-gray-400">ARPU</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 text-orange-500" />
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-white">{monetizationMetrics.purchaseFrequency.toFixed(1)}</div>
                <div className="text-sm text-gray-400">Avg Purchases/Month</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monetizationMetrics.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                      <div>
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-gray-400">{item.sales.toLocaleString()} sales</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">${item.revenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-400">Revenue by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(monetizationMetrics.revenueBySource).map(([source, amount]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{source.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(amount / monetizationMetrics.totalRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-white">${amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'geographic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-400">Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicData.map((data, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-white">{data.city}, {data.country}</div>
                        <div className="text-sm text-gray-400">{data.region}</div>
                      </div>
                      <Badge className="bg-purple-600">+{data.growthRate}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Players:</span>
                        <span className="text-white ml-1">{data.players.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Avg Ping:</span>
                        <span className="text-white ml-1">{data.averagePing}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Revenue:</span>
                        <span className="text-white ml-1">${data.revenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Growth:</span>
                        <span className="text-green-400 ml-1">+{data.growthRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-400">World Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-800 rounded flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Interactive geographic map</p>
                  <p className="text-sm text-gray-500">Player distribution worldwide</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-400">Player Behavior Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="h-96 bg-gray-800 rounded relative overflow-hidden">
                  {/* Mock heatmap visualization */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    {heatMapData.map((point, index) => (
                      <div
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${(point.x / 1000) * 100}%`,
                          top: `${(point.y / 600) * 100}%`
                        }}
                      >
                        <div
                          className={`w-16 h-16 rounded-full opacity-60 ${
                            point.type === 'kill' ? 'bg-red-500' :
                            point.type === 'death' ? 'bg-blue-500' :
                            point.type === 'pickup' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ opacity: point.intensity / 100 }}
                        />
                        <div className="text-xs text-white text-center mt-1">{point.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <span className="text-sm text-gray-300">Kills</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded" />
                    <span className="text-sm text-gray-300">Deaths</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded" />
                    <span className="text-sm text-gray-300">Pickups</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded" />
                    <span className="text-sm text-gray-300">Objectives</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">A/B Testing Results</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Activity className="w-4 h-4 mr-2" />
              Create New Test
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {abrTestResults.map(test => (
              <Card key={test.testId} className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-400">{test.testName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={test.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}>
                        {test.status.toUpperCase()}
                      </Badge>
                      {test.winner && (
                        <Badge className="bg-purple-600">Winner: {test.winner}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {test.variants.map((variant, index) => (
                      <div key={index} className="p-3 bg-gray-800 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{variant.name}</span>
                          {variant.name === test.winner && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">CR:</span>
                            <span className="text-white ml-1">{variant.conversionRate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Users:</span>
                            <span className="text-white ml-1">{variant.users.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Revenue:</span>
                            <span className="text-white ml-1">${variant.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                      <span className="text-sm text-gray-400">
                        Confidence: {test.confidence}%
                      </span>
                      <div className="flex space-x-2">
                        {test.status === 'running' && (
                          <Button size="sm" variant="outline" className="border-yellow-600">
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="border-gray-600">
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && gamePerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-400">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-green-400">{gamePerformance.averageFPS.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Average FPS</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-400">{gamePerformance.frameTime.toFixed(1)}ms</div>
                  <div className="text-sm text-gray-400">Frame Time</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{gamePerformance.networkLatency}ms</div>
                  <div className="text-sm text-gray-400">Network Latency</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-purple-400">{gamePerformance.serverResponseTime}ms</div>
                  <div className="text-sm text-gray-400">Server Response</div>
                </div>
              </div>
              <div className="mt-6 h-64 bg-gray-800 rounded flex items-center justify-center">
                <LineChart className="w-16 h-16 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-400">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">CPU Usage</span>
                  <span className="text-sm text-white">65%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Memory Usage</span>
                  <span className="text-sm text-white">78%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Disk I/O</span>
                  <span className="text-sm text-white">42%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Network Bandwidth</span>
                  <span className="text-sm text-white">89%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};