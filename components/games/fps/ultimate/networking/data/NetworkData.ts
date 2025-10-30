/**
 * GLXY Ultimate FPS - Network Data Architecture
 *
 * Complete data-driven networking system for multiplayer FPS:
 * - WebSocket-based client-server architecture
 * - Lag compensation with client-side prediction
 * - Server reconciliation and entity interpolation
 * - Packet compression and encryption
 * - Server browser and matchmaking
 * - Party system and voice chat
 *
 * @module NetworkData
 * @version 1.10.0-alpha
 */

import { Vector3, Euler } from 'three'

// ============================================================================
// ENUMERATIONS
// ============================================================================

/**
 * Network protocol types
 */
export enum NetworkProtocol {
  WEBSOCKET = 'websocket',
  WEBRTC = 'webrtc',
  UDP_SIMULATION = 'udp_simulation' // Simulated UDP over WebSocket
}

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error'
}

/**
 * Packet types for network communication
 */
export enum PacketType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  PING = 'ping',
  PONG = 'pong',

  // Authentication
  AUTH_REQUEST = 'auth_request',
  AUTH_RESPONSE = 'auth_response',
  AUTH_TOKEN = 'auth_token',

  // Game State
  INPUT = 'input',
  STATE_UPDATE = 'state_update',
  SNAPSHOT = 'snapshot',
  ENTITY_UPDATE = 'entity_update',

  // Game Events
  PLAYER_SPAWN = 'player_spawn',
  PLAYER_DEATH = 'player_death',
  WEAPON_FIRE = 'weapon_fire',
  WEAPON_HIT = 'weapon_hit',
  EXPLOSION = 'explosion',
  PICKUP = 'pickup',

  // Chat & Voice
  CHAT_MESSAGE = 'chat_message',
  VOICE_DATA = 'voice_data',
  VOICE_STATE = 'voice_state',

  // Room Management
  ROOM_CREATE = 'room_create',
  ROOM_JOIN = 'room_join',
  ROOM_LEAVE = 'room_leave',
  ROOM_UPDATE = 'room_update',
  ROOM_LIST = 'room_list',

  // Matchmaking
  MATCHMAKING_START = 'matchmaking_start',
  MATCHMAKING_CANCEL = 'matchmaking_cancel',
  MATCHMAKING_FOUND = 'matchmaking_found',

  // Reliable Delivery
  RELIABLE = 'reliable',
  RELIABLE_ACK = 'reliable_ack',

  // Error Handling
  ERROR = 'error'
}

/**
 * Packet priority levels
 */
export enum PacketPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Network synchronization modes
 */
export enum SyncMode {
  NONE = 'none',
  INTERPOLATION = 'interpolation',
  EXTRAPOLATION = 'extrapolation',
  DEAD_RECKONING = 'dead_reckoning'
}

/**
 * Server regions
 */
export enum ServerRegion {
  EUROPE = 'eu',
  NORTH_AMERICA = 'na',
  SOUTH_AMERICA = 'sa',
  ASIA = 'asia',
  OCEANIA = 'oce',
  MIDDLE_EAST = 'me',
  AFRICA = 'af'
}

/**
 * Matchmaking modes
 */
export enum MatchmakingMode {
  CASUAL = 'casual',
  COMPETITIVE = 'competitive',
  RANKED = 'ranked',
  CUSTOM = 'custom'
}

/**
 * Party roles
 */
export enum PartyRole {
  LEADER = 'leader',
  MEMBER = 'member'
}

// ============================================================================
// NETWORK METRICS & STATISTICS
// ============================================================================

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
  // Latency
  ping: number // Round-trip time in ms
  jitter: number // Ping variance in ms
  averagePing: number
  minPing: number
  maxPing: number

  // Packet Statistics
  packetsSent: number
  packetsReceived: number
  packetsLost: number
  packetLossRate: number // 0-1
  outOfOrderPackets: number
  duplicatePackets: number

  // Bandwidth
  bytesSent: number
  bytesReceived: number
  uploadBandwidth: number // bytes/sec
  downloadBandwidth: number // bytes/sec
  compressionRatio: number // 0-1

  // Timing
  serverTime: number
  clientTime: number
  timeDelta: number // Server-client time difference
  clockDrift: number // Time drift over time

  // Reliability
  retransmissions: number
  acksSent: number
  acksReceived: number

  // Performance
  updateRate: number // Updates per second
  tickRate: number // Server ticks per second
  snapshotRate: number // Snapshots per second

  // Buffer Statistics
  interpolationDelay: number
  bufferSize: number
  bufferUtilization: number // 0-1

  // Quality Indicators
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible'
  stability: number // 0-1, based on jitter and packet loss
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  // Connection Settings
  protocol: NetworkProtocol
  serverUrl: string
  port: number
  secure: boolean // Use WSS/HTTPS

  // Performance Settings
  tickRate: number // Server update rate (Hz)
  sendRate: number // Client send rate (Hz)
  updateRate: number // State update rate (Hz)
  snapshotRate: number // Snapshot rate (Hz)

  // Buffer Settings
  interpolationDelay: number // ms
  extrapolationLimit: number // ms
  bufferSize: number // Number of states to buffer
  maxBufferSize: number

  // Timeout Settings
  timeoutMs: number // Connection timeout
  heartbeatInterval: number // ms
  reconnectAttempts: number
  reconnectDelay: number // ms

  // Reliability Settings
  maxRetransmissions: number
  ackTimeout: number // ms
  reliablePacketLifetime: number // ms

  // Compression & Encryption
  compressionEnabled: boolean
  compressionThreshold: number // bytes
  encryptionEnabled: boolean
  encryptionKey?: string

  // Optimization Features
  deltaCompression: boolean // Only send changed data
  priorityUpdates: boolean // Prioritize important packets

  // Lag Compensation
  lagCompensationEnabled: boolean
  lagCompensationWindow: number // ms
  clientSidePrediction: boolean
  serverReconciliation: boolean

  // Entity Interpolation
  interpolationEnabled: boolean
  interpolationMode: SyncMode
  smoothingFactor: number // 0-1

  // Quality of Service
  adaptiveQuality: boolean // Adjust quality based on network
  minTickRate: number
  maxTickRate: number
  bandwidthLimit: number // bytes/sec, 0 = unlimited
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  protocol: NetworkProtocol.WEBSOCKET,
  serverUrl: 'ws://localhost',
  port: 3001,
  secure: false,

  tickRate: 64,
  sendRate: 30,
  updateRate: 20,
  snapshotRate: 10,

  interpolationDelay: 100,
  extrapolationLimit: 500,
  bufferSize: 10,
  maxBufferSize: 30,

  timeoutMs: 10000,
  heartbeatInterval: 1000,
  reconnectAttempts: 5,
  reconnectDelay: 2000,

  maxRetransmissions: 3,
  ackTimeout: 1000,
  reliablePacketLifetime: 5000,

  compressionEnabled: true,
  compressionThreshold: 256,
  encryptionEnabled: false,

  deltaCompression: true,
  priorityUpdates: true,

  lagCompensationEnabled: true,
  lagCompensationWindow: 1000,
  clientSidePrediction: true,
  serverReconciliation: true,

  interpolationEnabled: true,
  interpolationMode: SyncMode.INTERPOLATION,
  smoothingFactor: 0.3,

  adaptiveQuality: true,
  minTickRate: 20,
  maxTickRate: 128,
  bandwidthLimit: 0
}

// ============================================================================
// PACKET STRUCTURES
// ============================================================================

/**
 * Base packet structure
 */
export interface BasePacket {
  type: PacketType
  sequence: number // Packet sequence number
  timestamp: number // Client timestamp
  priority: PacketPriority
  reliable: boolean // Requires acknowledgment
  compressed: boolean
  encrypted: boolean
}

/**
 * Connection packet
 */
export interface ConnectionPacket extends BasePacket {
  type: PacketType.CONNECT | PacketType.DISCONNECT
  clientId?: string
  reason?: string
  version: string
}

/**
 * Authentication packet
 */
export interface AuthPacket extends BasePacket {
  type: PacketType.AUTH_REQUEST | PacketType.AUTH_RESPONSE | PacketType.AUTH_TOKEN
  token?: string
  userId?: string
  username?: string
  authenticated?: boolean
  error?: string
}

/**
 * Heartbeat packet
 */
export interface HeartbeatPacket extends BasePacket {
  type: PacketType.HEARTBEAT | PacketType.PING | PacketType.PONG
  clientTime: number
  serverTime?: number
}

/**
 * Input state for client-side prediction
 */
export interface InputState {
  sequence: number
  timestamp: number
  deltaTime: number

  // Movement
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  sprint: boolean

  // Actions
  aim: boolean
  shoot: boolean
  reload: boolean
  interact: boolean
  melee: boolean

  // Weapon
  weaponSlot: number
  weaponSwitch?: number

  // Camera
  yaw: number // Camera rotation
  pitch: number

  // Advanced Movement
  slide: boolean
  vault: boolean
  mantle: boolean

  // Server tracking
  processed: boolean // Server has processed this input
  acknowledgedSequence?: number
}

/**
 * Input packet
 */
export interface InputPacket extends BasePacket {
  type: PacketType.INPUT
  playerId: string
  inputs: InputState[]
}

/**
 * Player network state
 */
export interface PlayerNetworkState {
  playerId: string
  sequence: number
  timestamp: number

  // Transform
  position: Vector3
  rotation: Euler
  velocity: Vector3

  // State
  health: number
  armor: number
  stamina: number

  // Weapon
  currentWeapon: number
  ammo: number
  totalAmmo: number

  // Actions
  isSprinting: boolean
  isCrouching: boolean
  isAiming: boolean
  isShooting: boolean
  isReloading: boolean

  // Stats
  kills: number
  deaths: number
  score: number

  // Network
  isAlive: boolean
  isBot: boolean
  latency: number
}

/**
 * Entity network state
 */
export interface EntityNetworkState {
  entityId: string
  entityType: 'player' | 'projectile' | 'pickup' | 'vehicle' | 'destructible'
  sequence: number
  timestamp: number

  position: Vector3
  rotation?: Euler
  velocity?: Vector3

  state?: any // Entity-specific state
  ownerId?: string
}

/**
 * State update packet
 */
export interface StateUpdatePacket extends BasePacket {
  type: PacketType.STATE_UPDATE
  serverTime: number
  players: PlayerNetworkState[]
  entities: EntityNetworkState[]
  events: GameEvent[]
}

/**
 * Snapshot packet (full world state)
 */
export interface SnapshotPacket extends BasePacket {
  type: PacketType.SNAPSHOT
  serverTime: number
  sequence: number

  players: Map<string, PlayerNetworkState>
  entities: Map<string, EntityNetworkState>
  worldState: any

  // Delta compression (if enabled)
  deltaFrom?: number // Previous snapshot sequence
  changes?: any // Only changed data
}

/**
 * Game event types
 */
export enum GameEventType {
  PLAYER_SPAWN = 'player_spawn',
  PLAYER_DEATH = 'player_death',
  PLAYER_RESPAWN = 'player_respawn',
  WEAPON_FIRE = 'weapon_fire',
  WEAPON_HIT = 'weapon_hit',
  WEAPON_RELOAD = 'weapon_reload',
  EXPLOSION = 'explosion',
  PICKUP = 'pickup',
  OBJECTIVE_CAPTURED = 'objective_captured',
  ROUND_START = 'round_start',
  ROUND_END = 'round_end',
  MATCH_START = 'match_start',
  MATCH_END = 'match_end'
}

/**
 * Game event structure
 */
export interface GameEvent {
  type: GameEventType
  timestamp: number
  data: any

  // For player events
  playerId?: string
  targetId?: string

  // For weapon events
  weaponId?: string
  damage?: number
  position?: Vector3

  // For objective events
  objectiveId?: string
  teamId?: string
}

/**
 * Game event packet
 */
export interface GameEventPacket extends BasePacket {
  type: PacketType.WEAPON_FIRE | PacketType.WEAPON_HIT | PacketType.EXPLOSION | PacketType.PICKUP
  event: GameEvent
}

/**
 * Chat message packet
 */
export interface ChatPacket extends BasePacket {
  type: PacketType.CHAT_MESSAGE
  senderId: string
  senderName: string
  message: string
  channel: 'all' | 'team' | 'party' | 'whisper'
  recipientId?: string
}

/**
 * Voice chat packet
 */
export interface VoicePacket extends BasePacket {
  type: PacketType.VOICE_DATA | PacketType.VOICE_STATE
  senderId: string
  audioData?: ArrayBuffer
  codec?: string
  sampleRate?: number
  muted?: boolean
  speaking?: boolean
}

// ============================================================================
// LAG COMPENSATION
// ============================================================================

/**
 * Lag compensation configuration
 */
export interface LagCompensationConfig {
  enabled: boolean
  window: number // Time window for compensation in ms
  maxRewind: number // Maximum rewind time in ms

  // History tracking
  historySize: number // Number of snapshots to store
  minSnapshots: number // Minimum snapshots needed

  // Compensation modes
  hitboxRewind: boolean // Rewind hitboxes
  positionRewind: boolean // Rewind positions
  stateRewind: boolean // Rewind full state

  // Validation
  validateHits: boolean // Server-side hit validation
  maxDistanceError: number // Max acceptable distance error
  maxTimeError: number // Max acceptable time error
}

/**
 * Historical state for lag compensation
 */
export interface HistoricalState {
  sequence: number
  timestamp: number
  serverTime: number

  players: Map<string, PlayerNetworkState>
  entities: Map<string, EntityNetworkState>
}

// ============================================================================
// CLIENT-SIDE PREDICTION
// ============================================================================

/**
 * Client-side prediction configuration
 */
export interface PredictionConfig {
  enabled: boolean

  // Input buffering
  inputBufferSize: number
  inputResendCount: number // Number of times to resend unacknowledged inputs

  // Prediction
  predictMovement: boolean
  predictActions: boolean
  predictPhysics: boolean

  // Reconciliation
  reconciliationEnabled: boolean
  reconciliationThreshold: number // Position error threshold for reconciliation
  smoothReconciliation: boolean
  reconciliationSpeed: number // 0-1

  // Error correction
  errorCorrectionEnabled: boolean
  maxPositionError: number
  maxVelocityError: number
}

/**
 * Predicted state
 */
export interface PredictedState {
  sequence: number
  timestamp: number

  position: Vector3
  velocity: Vector3
  rotation: Euler

  inputs: InputState[]

  // Validation
  confirmed: boolean
  errorMargin: number
}

// ============================================================================
// ENTITY INTERPOLATION
// ============================================================================

/**
 * Entity interpolation configuration
 */
export interface InterpolationConfig {
  enabled: boolean
  mode: SyncMode

  // Interpolation
  delay: number // Interpolation delay in ms
  smoothing: number // Smoothing factor 0-1

  // Extrapolation
  maxExtrapolation: number // Max extrapolation time in ms
  extrapolationDamping: number // Velocity damping for extrapolation

  // Dead reckoning
  errorThreshold: number // Error threshold for correction
  correctionSpeed: number // Correction speed 0-1

  // Per-entity settings
  interpolatePosition: boolean
  interpolateRotation: boolean
  interpolateVelocity: boolean

  // Quality
  maxInterpolationError: number
  snapThreshold: number // Distance to snap instantly instead of interpolate
}

/**
 * Interpolation buffer entry
 */
export interface InterpolationBufferEntry {
  timestamp: number
  serverTime: number
  state: PlayerNetworkState | EntityNetworkState
}

// ============================================================================
// SERVER BROWSER
// ============================================================================

/**
 * Game server information
 */
export interface GameServerInfo {
  id: string
  name: string
  description: string

  // Connection
  address: string
  port: number
  region: ServerRegion

  // Status
  isOnline: boolean
  isPasswordProtected: boolean
  version: string

  // Capacity
  currentPlayers: number
  maxPlayers: number
  currentRooms: number
  maxRooms: number

  // Performance
  tickRate: number
  ping: number
  stability: number // 0-1

  // Game Info
  gameMode: string
  mapName: string

  // Anti-Cheat
  antiCheatEnabled: boolean
  vac: boolean

  // Moderation
  isOfficial: boolean
  isRanked: boolean
  allowsMods: boolean

  // Timestamps
  startedAt: number
  lastUpdate: number
}

/**
 * Server browser filters
 */
export interface ServerBrowserFilters {
  // Basic
  region?: ServerRegion
  gameMode?: string
  mapName?: string

  // Players
  notFull?: boolean
  notEmpty?: boolean
  hasPlayers?: boolean
  minPlayers?: number
  maxPlayers?: number

  // Performance
  maxPing?: number
  minStability?: number

  // Features
  official?: boolean
  ranked?: boolean
  passwordProtected?: boolean
  antiCheat?: boolean

  // Search
  searchQuery?: string

  // Sorting
  sortBy?: 'name' | 'players' | 'ping' | 'region' | 'mode'
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// MATCHMAKING
// ============================================================================

/**
 * Matchmaking configuration
 */
export interface MatchmakingConfig {
  mode: MatchmakingMode
  gameMode: string
  region: ServerRegion

  // Skill-based matching
  skillBased: boolean
  skillRange: number // Acceptable skill difference

  // Party
  partyId?: string
  partySize: number
  maxPartySize: number

  // Preferences
  preferredRegions: ServerRegion[]
  acceptedGameModes: string[]
  acceptedMaps: string[]

  // Timeouts
  searchTimeout: number // ms
  acceptTimeout: number // ms

  // Quality
  prioritizeSpeed: boolean // Fast match vs good match
  allowBots: boolean

  // Restrictions
  minPlayerLevel?: number
  maxPlayerLevel?: number
  requireRank?: boolean
}

/**
 * Matchmaking ticket
 */
export interface MatchmakingTicket {
  ticketId: string
  playerId: string
  partyId?: string

  config: MatchmakingConfig

  status: 'searching' | 'found' | 'accepted' | 'declined' | 'cancelled' | 'timeout'

  // Match info (when found)
  matchId?: string
  serverId?: string
  roomId?: string
  estimatedPing?: number

  // Timing
  createdAt: number
  foundAt?: number
  expiresAt: number

  // Metrics
  searchTime?: number
  averageWaitTime?: number
}

/**
 * Match found notification
 */
export interface MatchFoundData {
  ticketId: string
  matchId: string
  serverId: string
  roomId: string

  players: string[]
  estimatedPing: number

  acceptDeadline: number
}

// ============================================================================
// PARTY SYSTEM
// ============================================================================

/**
 * Party member
 */
export interface PartyMember {
  playerId: string
  username: string
  role: PartyRole

  // Status
  isReady: boolean
  isOnline: boolean

  // Stats
  level: number
  rank: string

  // Connection
  latency: number

  joinedAt: number
}

/**
 * Party information
 */
export interface PartyInfo {
  partyId: string
  leaderId: string

  members: Map<string, PartyMember>
  maxMembers: number

  // Status
  isInMatchmaking: boolean
  isInGame: boolean

  // Settings
  isPublic: boolean
  allowInvites: boolean

  // Voice chat
  voiceChatEnabled: boolean

  createdAt: number
}

/**
 * Party invitation
 */
export interface PartyInvitation {
  inviteId: string
  partyId: string
  senderId: string
  senderName: string
  recipientId: string

  status: 'pending' | 'accepted' | 'declined' | 'expired'

  createdAt: number
  expiresAt: number
}

// ============================================================================
// ROOM MANAGEMENT
// ============================================================================

/**
 * Game room information
 */
export interface GameRoomInfo {
  roomId: string
  serverId: string
  name: string

  // Host
  hostId: string

  // Game settings
  gameMode: string
  mapName: string
  maxPlayers: number

  // Status
  status: 'waiting' | 'starting' | 'playing' | 'ending' | 'finished'
  isPublic: boolean
  isPasswordProtected: boolean

  // Players
  players: Map<string, string> // playerId -> team
  spectators: Set<string>
  bots: number

  // Timing
  createdAt: number
  startedAt?: number
  endedAt?: number

  // Settings
  settings: any
}

/**
 * Room creation settings
 */
export interface RoomCreationSettings {
  name: string
  gameMode: string
  mapName: string
  maxPlayers: number

  isPublic: boolean
  password?: string

  allowSpectators: boolean
  allowBots: boolean
  botCount?: number
  botDifficulty?: string

  customSettings?: any
}

// ============================================================================
// NETWORK SECURITY
// ============================================================================

/**
 * Network security configuration
 */
export interface NetworkSecurityConfig {
  // Authentication
  requireAuth: boolean
  tokenExpiration: number // ms
  refreshToken: boolean

  // Encryption
  encryption: boolean
  encryptionAlgorithm: string
  keyExchange: boolean

  // Rate limiting
  rateLimitEnabled: boolean
  maxPacketsPerSecond: number
  maxBytesPerSecond: number

  // Anti-cheat
  antiCheatEnabled: boolean
  validateInputs: boolean
  validateHits: boolean
  validateMovement: boolean
  detectSpeedhack: boolean
  detectAimbot: boolean

  // DDoS Protection
  maxConnectionsPerIP: number
  connectionTimeout: number

  // Packet validation
  validateSequence: boolean
  validateTimestamp: boolean
  rejectOutdated: boolean
  outdatedThreshold: number // ms
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create default network metrics
 */
export function createDefaultNetworkMetrics(): NetworkMetrics {
  return {
    ping: 0,
    jitter: 0,
    averagePing: 0,
    minPing: 0,
    maxPing: 0,

    packetsSent: 0,
    packetsReceived: 0,
    packetsLost: 0,
    packetLossRate: 0,
    outOfOrderPackets: 0,
    duplicatePackets: 0,

    bytesSent: 0,
    bytesReceived: 0,
    uploadBandwidth: 0,
    downloadBandwidth: 0,
    compressionRatio: 0,

    serverTime: 0,
    clientTime: Date.now(),
    timeDelta: 0,
    clockDrift: 0,

    retransmissions: 0,
    acksSent: 0,
    acksReceived: 0,

    updateRate: 0,
    tickRate: 0,
    snapshotRate: 0,

    interpolationDelay: 0,
    bufferSize: 0,
    bufferUtilization: 0,

    connectionQuality: 'excellent',
    stability: 1.0
  }
}

/**
 * Calculate connection quality based on metrics
 */
export function calculateConnectionQuality(metrics: NetworkMetrics): NetworkMetrics['connectionQuality'] {
  const { ping, jitter, packetLossRate } = metrics

  // Excellent: <50ms ping, <10ms jitter, <1% packet loss
  if (ping < 50 && jitter < 10 && packetLossRate < 0.01) {
    return 'excellent'
  }

  // Good: <100ms ping, <20ms jitter, <3% packet loss
  if (ping < 100 && jitter < 20 && packetLossRate < 0.03) {
    return 'good'
  }

  // Fair: <150ms ping, <30ms jitter, <5% packet loss
  if (ping < 150 && jitter < 30 && packetLossRate < 0.05) {
    return 'fair'
  }

  // Poor: <250ms ping, <50ms jitter, <10% packet loss
  if (ping < 250 && jitter < 50 && packetLossRate < 0.10) {
    return 'poor'
  }

  // Terrible: Everything else
  return 'terrible'
}

/**
 * Calculate network stability (0-1)
 */
export function calculateNetworkStability(metrics: NetworkMetrics): number {
  const jitterFactor = Math.max(0, 1 - (metrics.jitter / 100))
  const lossFactor = Math.max(0, 1 - (metrics.packetLossRate * 10))

  return (jitterFactor + lossFactor) / 2
}

/**
 * Estimate bandwidth usage
 */
export function estimateBandwidth(
  tickRate: number,
  playerCount: number,
  avgPacketSize: number
): number {
  // Rough estimation: tickRate * playerCount * avgPacketSize
  return tickRate * playerCount * avgPacketSize
}

/**
 * Calculate interpolation time
 */
export function calculateInterpolationTime(
  currentTime: number,
  interpolationDelay: number,
  jitter: number
): number {
  // Add extra delay based on jitter for smoother interpolation
  const adaptiveDelay = interpolationDelay + (jitter * 1.5)
  return currentTime - adaptiveDelay
}

/**
 * Calculate extrapolation time
 */
export function calculateExtrapolationTime(
  lastUpdateTime: number,
  currentTime: number,
  maxExtrapolation: number
): number {
  const timeSinceUpdate = currentTime - lastUpdateTime
  return Math.min(timeSinceUpdate, maxExtrapolation)
}

/**
 * Validate packet sequence
 */
export function isSequenceValid(
  sequence: number,
  lastSequence: number,
  maxDifference: number = 1000
): boolean {
  // Handle sequence rollover
  const diff = sequence - lastSequence

  // Accept if sequence is newer and within reasonable range
  if (diff > 0 && diff < maxDifference) {
    return true
  }

  // Handle rollover (sequence wrapped around)
  if (diff < -maxDifference) {
    return true
  }

  return false
}

/**
 * Validate packet timestamp
 */
export function isTimestampValid(
  timestamp: number,
  serverTime: number,
  maxDifference: number = 5000
): boolean {
  const diff = Math.abs(timestamp - serverTime)
  return diff < maxDifference
}

/**
 * Compress packet data (simple string compression)
 */
export function compressPacketData(data: string): string {
  // Simple run-length encoding for demonstration
  // In production, use proper compression like zlib, lz4, or pako
  let compressed = ''
  let count = 1

  for (let i = 0; i < data.length; i++) {
    if (data[i] === data[i + 1]) {
      count++
    } else {
      compressed += count > 1 ? `${count}${data[i]}` : data[i]
      count = 1
    }
  }

  return compressed
}

/**
 * Decompress packet data
 */
export function decompressPacketData(compressed: string): string {
  // Reverse of compressPacketData
  let decompressed = ''
  let i = 0

  while (i < compressed.length) {
    if (/\d/.test(compressed[i])) {
      const count = parseInt(compressed[i])
      decompressed += compressed[i + 1].repeat(count)
      i += 2
    } else {
      decompressed += compressed[i]
      i++
    }
  }

  return decompressed
}

/**
 * Create packet ID for tracking
 */
export function createPacketId(type: PacketType, sequence: number): string {
  return `${type}_${sequence}`
}

/**
 * Get region name
 */
export function getRegionName(region: ServerRegion): string {
  const names: Record<ServerRegion, string> = {
    [ServerRegion.EUROPE]: 'Europe',
    [ServerRegion.NORTH_AMERICA]: 'North America',
    [ServerRegion.SOUTH_AMERICA]: 'South America',
    [ServerRegion.ASIA]: 'Asia',
    [ServerRegion.OCEANIA]: 'Oceania',
    [ServerRegion.MIDDLE_EAST]: 'Middle East',
    [ServerRegion.AFRICA]: 'Africa'
  }

  return names[region]
}

/**
 * Get region ping estimate
 */
export function getRegionPingEstimate(
  userRegion: ServerRegion,
  serverRegion: ServerRegion
): number {
  // Simplified ping estimation based on geographic distance
  // In production, use actual ping measurements

  if (userRegion === serverRegion) {
    return 20 // Same region
  }

  const distances: Record<ServerRegion, Record<ServerRegion, number>> = {
    [ServerRegion.EUROPE]: {
      [ServerRegion.EUROPE]: 20,
      [ServerRegion.NORTH_AMERICA]: 100,
      [ServerRegion.SOUTH_AMERICA]: 150,
      [ServerRegion.ASIA]: 120,
      [ServerRegion.OCEANIA]: 200,
      [ServerRegion.MIDDLE_EAST]: 80,
      [ServerRegion.AFRICA]: 100
    },
    [ServerRegion.NORTH_AMERICA]: {
      [ServerRegion.EUROPE]: 100,
      [ServerRegion.NORTH_AMERICA]: 20,
      [ServerRegion.SOUTH_AMERICA]: 80,
      [ServerRegion.ASIA]: 150,
      [ServerRegion.OCEANIA]: 180,
      [ServerRegion.MIDDLE_EAST]: 140,
      [ServerRegion.AFRICA]: 160
    },
    // Add other regions...
  } as any

  return distances[userRegion]?.[serverRegion] || 150
}

/**
 * Format bandwidth for display
 */
export function formatBandwidth(bytesPerSec: number): string {
  if (bytesPerSec < 1024) {
    return `${bytesPerSec.toFixed(0)} B/s`
  } else if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(2)} KB/s`
  } else {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`
  }
}

/**
 * Format ping for display
 */
export function formatPing(ping: number): string {
  return `${ping.toFixed(0)}ms`
}

/**
 * Get connection quality color
 */
export function getConnectionQualityColor(quality: NetworkMetrics['connectionQuality']): string {
  const colors: Record<NetworkMetrics['connectionQuality'], string> = {
    excellent: '#00ff00',
    good: '#7fff00',
    fair: '#ffff00',
    poor: '#ff7f00',
    terrible: '#ff0000'
  }

  return colors[quality]
}
