// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw, Activity, Zap, Network, Clock, AlertTriangle } from 'lucide-react'

interface PerformanceMetrics {
  messagesPerSecond: number
  averageLatency: number
  connectionUptime: number
  lastMessageTime: number
  pendingMoves: number
  clientMetrics: {
    [key: string]: {
      avg: number
      count: number
      last: number
    }
  }
}

interface ConnectionState {
  connected: boolean
  socketId?: string
  reconnectAttempts: number
  transport?: string
  performance: any
}

interface PerformanceMonitorProps {
  performanceMetrics?: PerformanceMetrics
  connectionState?: ConnectionState
  className?: string
}

export function PerformanceMonitor({
  performanceMetrics,
  connectionState,
  className = ''
}: PerformanceMonitorProps) {
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string, latency: number }>>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Update latency history
  useEffect(() => {
    if (performanceMetrics?.averageLatency) {
      const now = new Date().toLocaleTimeString()
      setLatencyHistory(prev => {
        const newHistory = [...prev, {
          time: now,
          latency: performanceMetrics.averageLatency
        }]

        // Keep only last 20 data points
        return newHistory.slice(-20)
      })
    }
  }, [performanceMetrics?.averageLatency])

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-green-600'
    if (latency < 100) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLatencyStatus = (latency: number) => {
    if (latency < 50) return 'excellent'
    if (latency < 100) return 'good'
    if (latency < 200) return 'fair'
    return 'poor'
  }

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getConnectionStatusBadge = () => {
    if (!connectionState) return null

    const { connected, reconnectAttempts } = connectionState

    if (connected && reconnectAttempts === 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
    }

    if (connected && reconnectAttempts > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Reconnected</Badge>
    }

    return <Badge className="bg-red-100 text-red-800 border-red-200">Disconnected</Badge>
  }

  if (!isExpanded) {
    return (
      <Card className={`w-full max-w-sm ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Connection
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {getConnectionStatusBadge()}
            {performanceMetrics && (
              <span className={`text-xs font-mono ${getLatencyColor(performanceMetrics.averageLatency)}`}>
                {Math.round(performanceMetrics.averageLatency)}ms
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Multiplayer Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="latency">Latency</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Connection Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Connection</span>
                </div>
                <div className="text-lg font-bold">
                  {connectionState?.connected ? 'Online' : 'Offline'}
                </div>
                {connectionState?.transport && (
                  <div className="text-xs text-gray-500">
                    via {connectionState.transport}
                  </div>
                )}
              </div>

              {/* Latency */}
              {performanceMetrics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Latency</span>
                  </div>
                  <div className={`text-lg font-bold ${getLatencyColor(performanceMetrics.averageLatency)}`}>
                    {Math.round(performanceMetrics.averageLatency)}ms
                  </div>
                  <div className="text-xs text-gray-500">
                    {getLatencyStatus(performanceMetrics.averageLatency)}
                  </div>
                </div>
              )}

              {/* Uptime */}
              {performanceMetrics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <div className="text-lg font-bold">
                    {formatUptime(performanceMetrics.connectionUptime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    session time
                  </div>
                </div>
              )}

              {/* Messages/sec */}
              {performanceMetrics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Activity</span>
                  </div>
                  <div className="text-lg font-bold">
                    {performanceMetrics.messagesPerSecond.toFixed(1)}/s
                  </div>
                  <div className="text-xs text-gray-500">
                    messages
                  </div>
                </div>
              )}
            </div>

            {/* Pending Moves Warning */}
            {performanceMetrics && performanceMetrics.pendingMoves > 5 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {performanceMetrics.pendingMoves} moves pending synchronization
                </span>
              </div>
            )}

            {/* Reconnection Progress */}
            {connectionState && connectionState.reconnectAttempts > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Reconnection Attempts</div>
                <Progress
                  value={(connectionState.reconnectAttempts / 5) * 100}
                  className="h-2"
                />
                <div className="text-xs text-gray-500">
                  {connectionState.reconnectAttempts}/5 attempts
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="latency" className="space-y-4">
            {latencyHistory.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}ms`, 'Latency']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {performanceMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500">Current</div>
                    <div className={`text-2xl font-bold ${getLatencyColor(performanceMetrics.averageLatency)}`}>
                      {Math.round(performanceMetrics.averageLatency)}ms
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500">Best</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.min(...latencyHistory.map(h => h.latency)) || 0}ms
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500">Worst</div>
                    <div className="text-2xl font-bold text-red-600">
                      {Math.max(...latencyHistory.map(h => h.latency)) || 0}ms
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {connectionState && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Connection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Socket ID:</span>
                      <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                        {connectionState.socketId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Transport:</span>
                      <div className="font-mono">
                        {connectionState.transport || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {performanceMetrics?.clientMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operation Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceMetrics.clientMetrics).map(([operation, metrics]) => (
                      <div key={operation} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{operation.replace(/_/g, ' ')}</span>
                        <div className="text-right">
                          <div className="text-sm font-mono">
                            {Math.round(metrics.avg)}ms avg
                          </div>
                          <div className="text-xs text-gray-500">
                            {metrics.count} samples
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {performanceMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Real-time Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Messages per second:</span>
                      <span className="font-mono">{performanceMetrics.messagesPerSecond.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending moves:</span>
                      <span className="font-mono">{performanceMetrics.pendingMoves}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last message:</span>
                      <span className="font-mono">
                        {performanceMetrics.lastMessageTime > 0
                          ? `${Math.round((Date.now() - performanceMetrics.lastMessageTime) / 1000)}s ago`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PerformanceMonitor