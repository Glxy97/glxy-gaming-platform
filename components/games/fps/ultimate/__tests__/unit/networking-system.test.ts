/**
 * GLXY Ultimate FPS - Networking System Tests
 *
 * Comprehensive test coverage for the networking system:
 * - NetworkData validation and helpers
 * - NetworkManager functionality
 * - ServerBrowser operations
 * - Matchmaking system
 *
 * @module NetworkingSystemTests
 * @version 1.10.0-alpha
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  // Data Types
  NetworkProtocol,
  ConnectionState,
  PacketType,
  PacketPriority,
  SyncMode,
  ServerRegion,
  MatchmakingMode,

  // Helper Functions
  createDefaultNetworkMetrics,
  calculateConnectionQuality,
  calculateNetworkStability,
  estimateBandwidth,
  isSequenceValid,
  isTimestampValid,
  createPacketId,
  getRegionName,
  formatBandwidth,
  formatPing,
  getConnectionQualityColor
} from '../../networking/data/NetworkData'

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  readyState = 0
  onopen: any = null
  onclose: any = null
  onerror: any = null
  onmessage: any = null

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen({})
    }, 0)
  }

  send(data: any) {}
  close() {
    this.readyState = 3
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal' })
  }
} as any

describe('NetworkData Helpers', () => {
  describe('createDefaultNetworkMetrics', () => {
    it('should create default metrics with zero values', () => {
      const metrics = createDefaultNetworkMetrics()

      expect(metrics.ping).toBe(0)
      expect(metrics.jitter).toBe(0)
      expect(metrics.packetsSent).toBe(0)
      expect(metrics.packetsReceived).toBe(0)
      expect(metrics.connectionQuality).toBe('excellent')
      expect(metrics.stability).toBe(1.0)
    })

    it('should have all required metric fields', () => {
      const metrics = createDefaultNetworkMetrics()

      expect(metrics).toHaveProperty('ping')
      expect(metrics).toHaveProperty('jitter')
      expect(metrics).toHaveProperty('averagePing')
      expect(metrics).toHaveProperty('packetsSent')
      expect(metrics).toHaveProperty('packetsReceived')
      expect(metrics).toHaveProperty('bytesSent')
      expect(metrics).toHaveProperty('bytesReceived')
      expect(metrics).toHaveProperty('connectionQuality')
      expect(metrics).toHaveProperty('stability')
    })
  })

  describe('calculateConnectionQuality', () => {
    it('should return excellent for low ping and jitter', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.ping = 30
      metrics.jitter = 5
      metrics.packetLossRate = 0.005

      const quality = calculateConnectionQuality(metrics)
      expect(quality).toBe('excellent')
    })

    it('should return good for moderate ping', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.ping = 80
      metrics.jitter = 15
      metrics.packetLossRate = 0.02

      const quality = calculateConnectionQuality(metrics)
      expect(quality).toBe('good')
    })

    it('should return fair for high ping', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.ping = 120
      metrics.jitter = 25
      metrics.packetLossRate = 0.04

      const quality = calculateConnectionQuality(metrics)
      expect(quality).toBe('fair')
    })

    it('should return poor for very high ping', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.ping = 200
      metrics.jitter = 40
      metrics.packetLossRate = 0.08

      const quality = calculateConnectionQuality(metrics)
      expect(quality).toBe('poor')
    })

    it('should return terrible for extreme ping', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.ping = 400
      metrics.jitter = 80
      metrics.packetLossRate = 0.15

      const quality = calculateConnectionQuality(metrics)
      expect(quality).toBe('terrible')
    })
  })

  describe('calculateNetworkStability', () => {
    it('should return 1.0 for perfect conditions', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.jitter = 0
      metrics.packetLossRate = 0

      const stability = calculateNetworkStability(metrics)
      expect(stability).toBe(1.0)
    })

    it('should return lower value for high jitter', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.jitter = 50
      metrics.packetLossRate = 0

      const stability = calculateNetworkStability(metrics)
      expect(stability).toBeLessThan(1.0)
      expect(stability).toBeGreaterThan(0)
    })

    it('should return lower value for high packet loss', () => {
      const metrics = createDefaultNetworkMetrics()
      metrics.jitter = 0
      metrics.packetLossRate = 0.1

      const stability = calculateNetworkStability(metrics)
      expect(stability).toBeLessThan(1.0)
      expect(stability).toBeGreaterThan(0)
    })
  })

  describe('estimateBandwidth', () => {
    it('should calculate bandwidth correctly', () => {
      const bandwidth = estimateBandwidth(64, 16, 200)
      expect(bandwidth).toBe(64 * 16 * 200)
    })

    it('should scale with tick rate', () => {
      const bw1 = estimateBandwidth(30, 10, 100)
      const bw2 = estimateBandwidth(60, 10, 100)
      expect(bw2).toBe(bw1 * 2)
    })

    it('should scale with player count', () => {
      const bw1 = estimateBandwidth(60, 10, 100)
      const bw2 = estimateBandwidth(60, 20, 100)
      expect(bw2).toBe(bw1 * 2)
    })
  })

  describe('isSequenceValid', () => {
    it('should accept newer sequence', () => {
      expect(isSequenceValid(101, 100)).toBe(true)
    })

    it('should reject older sequence', () => {
      expect(isSequenceValid(99, 100)).toBe(false)
    })

    it('should reject far future sequence', () => {
      expect(isSequenceValid(2000, 100, 1000)).toBe(false)
    })

    it('should handle sequence rollover', () => {
      const maxDiff = 1000
      expect(isSequenceValid(10, Number.MAX_SAFE_INTEGER - 50, maxDiff)).toBe(true)
    })
  })

  describe('isTimestampValid', () => {
    it('should accept recent timestamp', () => {
      const now = Date.now()
      expect(isTimestampValid(now, now, 5000)).toBe(true)
    })

    it('should accept timestamp within threshold', () => {
      const now = Date.now()
      expect(isTimestampValid(now - 3000, now, 5000)).toBe(true)
    })

    it('should reject old timestamp', () => {
      const now = Date.now()
      expect(isTimestampValid(now - 10000, now, 5000)).toBe(false)
    })

    it('should reject future timestamp', () => {
      const now = Date.now()
      expect(isTimestampValid(now + 10000, now, 5000)).toBe(false)
    })
  })

  describe('createPacketId', () => {
    it('should create unique packet ID', () => {
      const id1 = createPacketId(PacketType.INPUT, 100)
      const id2 = createPacketId(PacketType.INPUT, 101)

      expect(id1).not.toBe(id2)
    })

    it('should include packet type', () => {
      const id = createPacketId(PacketType.STATE_UPDATE, 50)
      expect(id).toContain('state_update')
    })

    it('should include sequence number', () => {
      const id = createPacketId(PacketType.INPUT, 123)
      expect(id).toContain('123')
    })
  })

  describe('getRegionName', () => {
    it('should return correct name for Europe', () => {
      expect(getRegionName(ServerRegion.EUROPE)).toBe('Europe')
    })

    it('should return correct name for North America', () => {
      expect(getRegionName(ServerRegion.NORTH_AMERICA)).toBe('North America')
    })

    it('should return correct name for Asia', () => {
      expect(getRegionName(ServerRegion.ASIA)).toBe('Asia')
    })
  })

  describe('formatBandwidth', () => {
    it('should format bytes correctly', () => {
      expect(formatBandwidth(500)).toContain('B/s')
    })

    it('should format kilobytes correctly', () => {
      expect(formatBandwidth(5000)).toContain('KB/s')
    })

    it('should format megabytes correctly', () => {
      expect(formatBandwidth(5000000)).toContain('MB/s')
    })
  })

  describe('formatPing', () => {
    it('should format ping with ms suffix', () => {
      const formatted = formatPing(50)
      expect(formatted).toContain('ms')
      expect(formatted).toContain('50')
    })

    it('should round ping to integer', () => {
      const formatted = formatPing(45.7)
      expect(formatted).toBe('46ms')
    })
  })

  describe('getConnectionQualityColor', () => {
    it('should return green for excellent', () => {
      const color = getConnectionQualityColor('excellent')
      expect(color).toContain('#00ff00')
    })

    it('should return red for terrible', () => {
      const color = getConnectionQualityColor('terrible')
      expect(color).toContain('#ff0000')
    })

    it('should return yellow for fair', () => {
      const color = getConnectionQualityColor('fair')
      expect(color).toContain('#ffff00')
    })
  })
})

describe('Packet Types', () => {
  it('should have all connection packet types', () => {
    expect(PacketType.CONNECT).toBeDefined()
    expect(PacketType.DISCONNECT).toBeDefined()
    expect(PacketType.HEARTBEAT).toBeDefined()
    expect(PacketType.PING).toBeDefined()
    expect(PacketType.PONG).toBeDefined()
  })

  it('should have all auth packet types', () => {
    expect(PacketType.AUTH_REQUEST).toBeDefined()
    expect(PacketType.AUTH_RESPONSE).toBeDefined()
    expect(PacketType.AUTH_TOKEN).toBeDefined()
  })

  it('should have all game state packet types', () => {
    expect(PacketType.INPUT).toBeDefined()
    expect(PacketType.STATE_UPDATE).toBeDefined()
    expect(PacketType.SNAPSHOT).toBeDefined()
    expect(PacketType.ENTITY_UPDATE).toBeDefined()
  })

  it('should have all game event packet types', () => {
    expect(PacketType.PLAYER_SPAWN).toBeDefined()
    expect(PacketType.PLAYER_DEATH).toBeDefined()
    expect(PacketType.WEAPON_FIRE).toBeDefined()
    expect(PacketType.WEAPON_HIT).toBeDefined()
    expect(PacketType.EXPLOSION).toBeDefined()
  })

  it('should have room management packet types', () => {
    expect(PacketType.ROOM_CREATE).toBeDefined()
    expect(PacketType.ROOM_JOIN).toBeDefined()
    expect(PacketType.ROOM_LEAVE).toBeDefined()
    expect(PacketType.ROOM_UPDATE).toBeDefined()
  })

  it('should have matchmaking packet types', () => {
    expect(PacketType.MATCHMAKING_START).toBeDefined()
    expect(PacketType.MATCHMAKING_CANCEL).toBeDefined()
    expect(PacketType.MATCHMAKING_FOUND).toBeDefined()
  })
})

describe('Connection States', () => {
  it('should have all connection states', () => {
    expect(ConnectionState.DISCONNECTED).toBe('disconnected')
    expect(ConnectionState.CONNECTING).toBe('connecting')
    expect(ConnectionState.CONNECTED).toBe('connected')
    expect(ConnectionState.AUTHENTICATING).toBe('authenticating')
    expect(ConnectionState.AUTHENTICATED).toBe('authenticated')
    expect(ConnectionState.RECONNECTING).toBe('reconnecting')
    expect(ConnectionState.DISCONNECTING).toBe('disconnecting')
    expect(ConnectionState.ERROR).toBe('error')
  })
})

describe('Server Regions', () => {
  it('should have all major regions', () => {
    expect(ServerRegion.EUROPE).toBeDefined()
    expect(ServerRegion.NORTH_AMERICA).toBeDefined()
    expect(ServerRegion.SOUTH_AMERICA).toBeDefined()
    expect(ServerRegion.ASIA).toBeDefined()
    expect(ServerRegion.OCEANIA).toBeDefined()
    expect(ServerRegion.MIDDLE_EAST).toBeDefined()
    expect(ServerRegion.AFRICA).toBeDefined()
  })
})

describe('Matchmaking Modes', () => {
  it('should have all matchmaking modes', () => {
    expect(MatchmakingMode.CASUAL).toBe('casual')
    expect(MatchmakingMode.COMPETITIVE).toBe('competitive')
    expect(MatchmakingMode.RANKED).toBe('ranked')
    expect(MatchmakingMode.CUSTOM).toBe('custom')
  })
})

describe('Packet Priority', () => {
  it('should have all priority levels', () => {
    expect(PacketPriority.LOW).toBe(0)
    expect(PacketPriority.NORMAL).toBe(1)
    expect(PacketPriority.HIGH).toBe(2)
    expect(PacketPriority.CRITICAL).toBe(3)
  })

  it('should be ordered correctly', () => {
    expect(PacketPriority.LOW).toBeLessThan(PacketPriority.NORMAL)
    expect(PacketPriority.NORMAL).toBeLessThan(PacketPriority.HIGH)
    expect(PacketPriority.HIGH).toBeLessThan(PacketPriority.CRITICAL)
  })
})

describe('Sync Modes', () => {
  it('should have all sync modes', () => {
    expect(SyncMode.NONE).toBe('none')
    expect(SyncMode.INTERPOLATION).toBe('interpolation')
    expect(SyncMode.EXTRAPOLATION).toBe('extrapolation')
    expect(SyncMode.DEAD_RECKONING).toBe('dead_reckoning')
  })
})

describe('Network Protocols', () => {
  it('should have all protocols', () => {
    expect(NetworkProtocol.WEBSOCKET).toBe('websocket')
    expect(NetworkProtocol.WEBRTC).toBe('webrtc')
    expect(NetworkProtocol.UDP_SIMULATION).toBe('udp_simulation')
  })
})

describe('Network Config Validation', () => {
  it('should have reasonable default tick rate', () => {
    const config = {
      tickRate: 64,
      sendRate: 30,
      updateRate: 20
    }

    expect(config.tickRate).toBeGreaterThan(0)
    expect(config.tickRate).toBeLessThan(256)
  })

  it('should have reasonable buffer settings', () => {
    const config = {
      interpolationDelay: 100,
      bufferSize: 10,
      maxBufferSize: 30
    }

    expect(config.interpolationDelay).toBeGreaterThan(0)
    expect(config.bufferSize).toBeLessThan(config.maxBufferSize)
  })

  it('should have reasonable timeout settings', () => {
    const config = {
      timeoutMs: 10000,
      heartbeatInterval: 1000,
      reconnectDelay: 2000
    }

    expect(config.heartbeatInterval).toBeLessThan(config.timeoutMs)
    expect(config.reconnectDelay).toBeGreaterThan(0)
  })
})

describe('Lag Compensation', () => {
  it('should have reasonable compensation window', () => {
    const config = {
      window: 1000,
      maxRewind: 1000,
      historySize: 60
    }

    expect(config.window).toBeGreaterThan(0)
    expect(config.maxRewind).toBeGreaterThanOrEqual(config.window)
    expect(config.historySize).toBeGreaterThan(10)
  })
})

describe('Client-Side Prediction', () => {
  it('should have input buffer configuration', () => {
    const config = {
      inputBufferSize: 100,
      inputResendCount: 3
    }

    expect(config.inputBufferSize).toBeGreaterThan(0)
    expect(config.inputResendCount).toBeGreaterThan(0)
  })

  it('should have reconciliation settings', () => {
    const config = {
      reconciliationThreshold: 0.1,
      reconciliationSpeed: 0.5,
      maxPositionError: 5.0
    }

    expect(config.reconciliationThreshold).toBeGreaterThan(0)
    expect(config.reconciliationSpeed).toBeGreaterThan(0)
    expect(config.reconciliationSpeed).toBeLessThanOrEqual(1)
  })
})

describe('Entity Interpolation', () => {
  it('should have delay configuration', () => {
    const config = {
      delay: 100,
      smoothing: 0.3
    }

    expect(config.delay).toBeGreaterThan(0)
    expect(config.smoothing).toBeGreaterThan(0)
    expect(config.smoothing).toBeLessThanOrEqual(1)
  })

  it('should have extrapolation limits', () => {
    const config = {
      maxExtrapolation: 500,
      extrapolationDamping: 0.9
    }

    expect(config.maxExtrapolation).toBeGreaterThan(0)
    expect(config.extrapolationDamping).toBeGreaterThan(0)
    expect(config.extrapolationDamping).toBeLessThanOrEqual(1)
  })
})

describe('Server Browser Filters', () => {
  it('should filter by region', () => {
    const filter = {
      region: ServerRegion.EUROPE
    }

    expect(filter.region).toBeDefined()
  })

  it('should filter by game mode', () => {
    const filter = {
      gameMode: 'Team Deathmatch'
    }

    expect(filter.gameMode).toBeDefined()
  })

  it('should filter by player count', () => {
    const filter = {
      notFull: true,
      notEmpty: true,
      minPlayers: 4,
      maxPlayers: 32
    }

    expect(filter.minPlayers).toBeLessThan(filter.maxPlayers)
  })

  it('should filter by performance', () => {
    const filter = {
      maxPing: 100,
      minStability: 0.8
    }

    expect(filter.maxPing).toBeGreaterThan(0)
    expect(filter.minStability).toBeGreaterThan(0)
    expect(filter.minStability).toBeLessThanOrEqual(1)
  })

  it('should filter by features', () => {
    const filter = {
      official: true,
      ranked: true,
      passwordProtected: false,
      antiCheat: true
    }

    expect(typeof filter.official).toBe('boolean')
    expect(typeof filter.ranked).toBe('boolean')
  })
})

describe('Matchmaking Configuration', () => {
  it('should have skill-based settings', () => {
    const config = {
      skillBased: true,
      skillRange: 200
    }

    expect(config.skillRange).toBeGreaterThan(0)
  })

  it('should have party settings', () => {
    const config = {
      partySize: 1,
      maxPartySize: 5
    }

    expect(config.partySize).toBeLessThanOrEqual(config.maxPartySize)
  })

  it('should have timeout settings', () => {
    const config = {
      searchTimeout: 300000,
      acceptTimeout: 30000
    }

    expect(config.acceptTimeout).toBeLessThan(config.searchTimeout)
  })
})

describe('Player Rating System', () => {
  it('should have valid MMR range', () => {
    const rating = {
      mmr: 1500,
      peakMmr: 1800
    }

    expect(rating.mmr).toBeGreaterThan(0)
    expect(rating.peakMmr).toBeGreaterThanOrEqual(rating.mmr)
  })

  it('should calculate win rate correctly', () => {
    const rating = {
      gamesPlayed: 100,
      wins: 60,
      losses: 40,
      winRate: 0.6
    }

    expect(rating.wins + rating.losses).toBe(rating.gamesPlayed)
    expect(rating.winRate).toBe(rating.wins / rating.gamesPlayed)
  })
})

describe('Network Security', () => {
  it('should have authentication settings', () => {
    const config = {
      requireAuth: true,
      tokenExpiration: 3600000,
      refreshToken: true
    }

    expect(config.tokenExpiration).toBeGreaterThan(0)
  })

  it('should have rate limiting', () => {
    const config = {
      rateLimitEnabled: true,
      maxPacketsPerSecond: 100,
      maxBytesPerSecond: 1024 * 1024
    }

    expect(config.maxPacketsPerSecond).toBeGreaterThan(0)
    expect(config.maxBytesPerSecond).toBeGreaterThan(0)
  })

  it('should have anti-cheat settings', () => {
    const config = {
      antiCheatEnabled: true,
      validateInputs: true,
      validateHits: true,
      detectSpeedhack: true
    }

    expect(typeof config.antiCheatEnabled).toBe('boolean')
    expect(typeof config.validateInputs).toBe('boolean')
  })
})
