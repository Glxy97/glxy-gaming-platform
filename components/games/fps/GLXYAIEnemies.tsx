// @ts-nocheck
/**
 * GLXY AI Opponents System - Phase 2 Implementation
 * Advanced Bot AI with Pathfinding, Combat Behavior, and Adaptive Learning
 */

'use client'


import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { AnimationClip } from 'three'
import {
  Brain,
  Zap,
  Shield,
  Target,
  Eye,
  AlertTriangle,
  TrendingUp,
  Activity,
  Settings,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Users,
  Sword,
  Crosshair,
  Map as MapIcon,
  Route,
  BrainCircuit,
  Trash2
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
import { toast } from 'sonner'

// AI Personality Types
export interface AIPersonality {
  id: string
  name: string
  description: string
  aggressiveness: number // 0-100
  accuracy: number // 0-100
  reactionTime: number // milliseconds
  tacticalThinking: number // 0-100
  teamCoordination: number // 0-100
  learningRate: number // 0-100
  preferredWeapon: string[]
  behaviorTraits: string[]
  movementPattern: 'aggressive' | 'cautious' | 'tactical' | 'flanking' | 'defensive'
  icon: string
  color: string
}

// AI Difficulty Levels
export interface AIDifficulty {
  id: string
  name: string
  description: string
  healthMultiplier: number
  damageMultiplier: number
  accuracyBonus: number
  reactionTimeMultiplier: number
  visionRange: number
  hearingRange: number
  equipmentLevel: number
  teamworkLevel: number
  color: string
}

// AI Bot Configuration
export interface AIBot {
  id: string
  name: string
  personality: AIPersonality
  difficulty: AIDifficulty
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  maxHealth: number
  armor: number
  isAlive: boolean
  currentWeapon: string
  ammo: number
  grenades: number
  equipment: string[]

  // AI State
  currentState: AIState
  target: THREE.Vector3 | null
  lastKnownPlayerPosition: THREE.Vector3 | null
  alertLevel: number // 0-100
  morale: number // 0-100
  stamina: number // 0-100

  // Movement
  pathfinding: PathfindingNode[]
  currentPathIndex: number
  coverPositions: THREE.Vector3[]
  currentCover: THREE.Vector3 | null

  // Combat
  isAiming: boolean
  isFiring: boolean
  lastShotTime: number
  burstFireCount: number
  reloadTime: number

  // Behavior
  behaviorTimer: number
  nextDecisionTime: number
  combatStyle: 'aggressive' | 'defensive' | 'tactical'
  engagementRange: number

  // Learning
  experience: number
  kills: number
  deaths: number
  accuracy: number
  survivalTime: number
  learnedPatterns: Map<string, number>

  // Team
  teamId: string
  squadPosition: 'leader' | 'member' | 'lone_wolf'
  isFollowingOrders: boolean
  orders: AIOrder[]

  // Visual
  mesh?: THREE.Group
  animations: Map<string, AnimationClip>
  currentAnimation: string

  // Audio
  voiceProfile: AIVoiceProfile
  lastAudioTime: number

  // Methods
  lookAt?(direction: THREE.Vector3): void
  findCover?(): void
  generateFlankingPath?(): void
}

// AI States
export type AIState =
  | 'idle'
  | 'patrolling'
  | 'investigating'
  | 'searching'
  | 'engaging'
  | 'taking_cover'
  | 'covering'
  | 'reloading'
  | 'retreating'
  | 'flanking'
  | 'supporting'
  | 'planting'
  | 'defusing'
  | 'reviving'
  | 'dead'
  | 'respawning'

// Pathfinding
export interface PathfindingNode {
  position: THREE.Vector3
  cost: number
  neighbors: PathfindingNode[]
  isCover: boolean
  height: number
  isOccupied: boolean
}

// AI Orders
export interface AIOrder {
  id: string
  type: 'attack' | 'defend' | 'patrol' | 'support' | 'regroup' | 'flank' | 'camp'
  priority: number
  target?: THREE.Vector3
  description: string
  issuer: string
  timestamp: number
  isCompleted: boolean
}

// AI Voice Profile
export interface AIVoiceProfile {
  id: string
  name: string
  language: string
  accent: string
  pitch: number
  speed: number
  volume: number
  personality: 'calm' | 'aggressive' | 'tactical' | 'casual'
  responses: Map<string, string[]>
}

// AI Learning Data
export interface AILearningData {
  playerPatterns: Map<string, PlayerPattern>
  successfulTactics: Map<string, number>
  failedTactics: Map<string, number>
  mapKnowledge: Map<string, MapKnowledge>
  weaponPreferences: Map<string, number>
  timingPatterns: Map<string, number[]>
}

export interface PlayerPattern {
  movementStyle: 'aggressive' | 'cautious' | 'unpredictable'
  preferredPositions: THREE.Vector3[]
  reactionTendencies: Map<string, number>
  weaponUsage: Map<string, number>
  accuracyTrend: number[]
  lastEncounters: number[]
}

export interface MapKnowledge {
  positions: Map<string, PositionData>
  coverSpots: THREE.Vector3[]
  dangerZones: THREE.Vector3[]
  strategicPoints: THREE.Vector3[]
  spawnPoints: THREE.Vector3[]
  objectives: THREE.Vector3[]
}

export interface PositionData {
  visits: number
  successRate: number
  dangerLevel: number
  lastVisited: number
  encounters: number
}

export class GLXYAIEnemies {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private playerPosition: THREE.Vector3
  private playerVelocity: THREE.Vector3

  // AI Management
  private bots: Map<string, AIBot> = new Map<string, AIBot>()
  private activeBots: Set<string> = new Set<string>()
  private maxBots: number = 16
  private botSpawnRadius: number = 50
  private botDespawnRadius: number = 100

  // AI Personalities
  private personalities: Map<string, AIPersonality> = new Map<string, AIPersonality>()
  private difficulties: Map<string, AIDifficulty> = new Map<string, AIDifficulty>()
  private voiceProfiles: Map<string, AIVoiceProfile> = new Map<string, AIVoiceProfile>()

  // Pathfinding
  private pathfindingGrid: PathfindingNode[][][] = []
  private gridSize: number = 2
  private mapBounds: THREE.Box3
  private coverPositions: THREE.Vector3[] = []

  // AI Learning
  private learningData: AILearningData
  private isLearningEnabled: boolean = true
  private learningUpdateInterval: number = 5000
  private lastLearningUpdate: number = 0

  // AI Configuration
  private aiSettings: {
    enableAdvancedAI: boolean
    enableTeamwork: boolean
    enableLearning: boolean
    difficultyScaling: boolean
    dynamicDifficulty: boolean
    botReactionTime: number
    botAccuracy: number
    botVisionRange: number
    botHearingRange: number
    maxConcurrentBots: number
    spawnRate: number
  }

  // Performance
  private aiUpdateTime: number = 100 // Update AI every 100ms
  private lastAIUpdate: number = 0
  private performanceMode: boolean = false

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene
    this.camera = camera
    this.playerPosition = new THREE.Vector3()
    this.playerVelocity = new THREE.Vector3()
    this.mapBounds = new THREE.Box3(new THREE.Vector3(-50, 0, -50), new THREE.Vector3(50, 20, 50))

    this.learningData = {
      playerPatterns: new Map<string, any>(),
      successfulTactics: new Map<string, any>(),
      failedTactics: new Map<string, any>(),
      mapKnowledge: new Map<string, any>(),
      weaponPreferences: new Map<string, any>(),
      timingPatterns: new Map<string, any>()
    }

    this.aiSettings = {
      enableAdvancedAI: true,
      enableTeamwork: true,
      enableLearning: true,
      difficultyScaling: true,
      dynamicDifficulty: true,
      botReactionTime: 500,
      botAccuracy: 50,
      botVisionRange: 30,
      botHearingRange: 20,
      maxConcurrentBots: 12,
      spawnRate: 2000
    }

    this.initializePersonalities()
    this.initializeDifficulties()
    this.initializeVoiceProfiles()
    this.initializePathfinding()
  }

  private initializePersonalities(): void {
    const personalities: AIPersonality[] = [
      {
        id: 'aggressive_assault',
        name: 'Aggressive Assault',
        description: 'Highly aggressive, rushes enemies with close-range weapons',
        aggressiveness: 90,
        accuracy: 60,
        reactionTime: 200,
        tacticalThinking: 30,
        teamCoordination: 50,
        learningRate: 60,
        preferredWeapon: ['shotgun', 'smg'],
        behaviorTraits: ['rush', 'push', 'close_combat', 'high_risk'],
        movementPattern: 'aggressive',
        icon: '⚔️',
        color: '#ff4444'
      },
      {
        id: 'tactical_sniper',
        name: 'Tactical Sniper',
        description: 'Patient and precise, excels at long-range engagements',
        aggressiveness: 20,
        accuracy: 95,
        reactionTime: 800,
        tacticalThinking: 90,
        teamCoordination: 70,
        learningRate: 80,
        preferredWeapon: ['sniper', 'dmr'],
        behaviorTraits: ['patience', 'precision', 'positioning', 'long_range'],
        movementPattern: 'tactical',
        icon: '🎯',
        color: '#4444ff'
      },
      {
        id: 'support_medic',
        name: 'Support Medic',
        description: 'Team-oriented, focuses on healing and supporting teammates',
        aggressiveness: 40,
        accuracy: 70,
        reactionTime: 400,
        tacticalThinking: 75,
        teamCoordination: 95,
        learningRate: 70,
        preferredWeapon: ['smg', 'pistol'],
        behaviorTraits: ['teamwork', 'healing', 'support', 'cautious'],
        movementPattern: 'defensive',
        icon: '💊',
        color: '#44ff44'
      },
      {
        id: 'flanker_assassin',
        name: 'Flanker Assassin',
        description: 'Stealthy and deceptive, uses flanking routes and surprise attacks',
        aggressiveness: 60,
        accuracy: 80,
        reactionTime: 300,
        tacticalThinking: 85,
        teamCoordination: 60,
        learningRate: 90,
        preferredWeapon: ['smg', 'pistol', 'knife'],
        behaviorTraits: ['stealth', 'flanking', 'deception', 'surprise'],
        movementPattern: 'flanking',
        icon: '🗡️',
        color: '#ff44ff'
      },
      {
        id: 'defensive_anchor',
        name: 'Defensive Anchor',
        description: 'Defensive-minded, holds positions and provides cover fire',
        aggressiveness: 30,
        accuracy: 75,
        reactionTime: 350,
        tacticalThinking: 80,
        teamCoordination: 85,
        learningRate: 65,
        preferredWeapon: ['assault', 'lmg'],
        behaviorTraits: ['defense', 'covering_fire', 'positioning', 'patience'],
        movementPattern: 'defensive',
        icon: '🛡️',
        color: '#ffff44'
      },
      {
        id: 'adaptive_pro',
        name: 'Adaptive Pro',
        description: 'Learns from player behavior and adapts strategies',
        aggressiveness: 50,
        accuracy: 85,
        reactionTime: 250,
        tacticalThinking: 95,
        teamCoordination: 75,
        learningRate: 100,
        preferredWeapon: ['assault', 'smg', 'sniper'],
        behaviorTraits: ['adaptation', 'learning', 'versatility', 'counter_play'],
        movementPattern: 'tactical',
        icon: '🧠',
        color: '#ff8844'
      }
    ]

    personalities.forEach(personality => {
      this.personalities.set(personality.id, personality)
    })
  }

  private initializeDifficulties(): void {
    const difficulties: AIDifficulty[] = [
      {
        id: 'recruit',
        name: 'Recruit',
        description: 'Beginner-friendly AI with lower accuracy and slower reactions',
        healthMultiplier: 0.8,
        damageMultiplier: 0.7,
        accuracyBonus: -20,
        reactionTimeMultiplier: 1.5,
        visionRange: 20,
        hearingRange: 15,
        equipmentLevel: 1,
        teamworkLevel: 30,
        color: '#90EE90'
      },
      {
        id: 'regular',
        name: 'Regular',
        description: 'Balanced AI for normal gameplay experience',
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        accuracyBonus: 0,
        reactionTimeMultiplier: 1.0,
        visionRange: 30,
        hearingRange: 20,
        equipmentLevel: 2,
        teamworkLevel: 60,
        color: '#87CEEB'
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Experienced AI with better tactics and equipment',
        healthMultiplier: 1.2,
        damageMultiplier: 1.2,
        accuracyBonus: 15,
        reactionTimeMultiplier: 0.8,
        visionRange: 40,
        hearingRange: 25,
        equipmentLevel: 3,
        teamworkLevel: 80,
        color: '#DDA0DD'
      },
      {
        id: 'elite',
        name: 'Elite',
        description: 'Highly skilled AI with advanced tactics and coordination',
        healthMultiplier: 1.5,
        damageMultiplier: 1.4,
        accuracyBonus: 25,
        reactionTimeMultiplier: 0.6,
        visionRange: 50,
        hearingRange: 30,
        equipmentLevel: 4,
        teamworkLevel: 95,
        color: '#FFB347'
      },
      {
        id: 'nightmare',
        name: 'Nightmare',
        description: 'Extremely challenging AI with perfect accuracy and tactics',
        healthMultiplier: 2.0,
        damageMultiplier: 1.8,
        accuracyBonus: 35,
        reactionTimeMultiplier: 0.4,
        visionRange: 60,
        hearingRange: 40,
        equipmentLevel: 5,
        teamworkLevel: 100,
        color: '#FF6B6B'
      }
    ]

    difficulties.forEach(difficulty => {
      this.difficulties.set(difficulty.id, difficulty)
    })
  }

  private initializeVoiceProfiles(): void {
    const profiles: AIVoiceProfile[] = [
      {
        id: 'male_soldier',
        name: 'Male Soldier',
        language: 'english',
        accent: 'american',
        pitch: 1.0,
        speed: 1.0,
        volume: 0.8,
        personality: 'tactical',
        responses: new Map([
          ['enemy_spotted', ['Enemy spotted!', 'Contact front!', 'Hostiles detected!']],
          ['reloading', ['Reloading!', 'Cover me, reloading!', 'Need to reload!']],
          ['grenade', ['Grenade out!', 'Fire in the hole!', 'Get to cover!']],
          ['under_fire', ['I\'m hit!', 'Under heavy fire!', 'Need backup!']],
          ['kill', ['Target neutralized!', 'Enemy down!', 'Got one!']]
        ])
      },
      {
        id: 'female_soldier',
        name: 'Female Soldier',
        language: 'english',
        accent: 'british',
        pitch: 1.2,
        speed: 0.9,
        volume: 0.7,
        personality: 'calm',
        responses: new Map([
          ['enemy_spotted', ['Visual on enemy.', 'Target acquired.', 'Hostile located.']],
          ['reloading', ['Reloading weapon.', 'Changing magazine.', 'Need to reload.']],
          ['grenade', ['Throwing grenade.', 'Incendiary out.', 'Explosive deployed.']],
          ['under_fire', ['Taking fire!', 'I\'m pinned down!', 'Suppressing fire needed!']],
          ['kill', ['Target eliminated.', 'Threat neutralized.', 'Hostile down.']]
        ])
      }
    ]

    profiles.forEach(profile => {
      this.voiceProfiles.set(profile.id, profile)
    })
  }

  private initializePathfinding(): void {
    // Create 3D grid for pathfinding
    const size = this.mapBounds.getSize(new THREE.Vector3())
    const gridX = Math.ceil(size.x / this.gridSize)
    const gridY = Math.ceil(size.y / this.gridSize)
    const gridZ = Math.ceil(size.z / this.gridSize)

    for (let x = 0; x < gridX; x++) {
      this.pathfindingGrid[x] = []
      for (let y = 0; y < gridY; y++) {
        this.pathfindingGrid[x][y] = []
        for (let z = 0; z < gridZ; z++) {
          const worldPos = new THREE.Vector3(
            this.mapBounds.min.x + x * this.gridSize,
            this.mapBounds.min.y + y * this.gridSize,
            this.mapBounds.min.z + z * this.gridSize
          )

          const node: PathfindingNode = {
            position: worldPos,
            cost: 1.0,
            neighbors: [],
            isCover: Math.random() > 0.7, // 30% chance of being cover
            height: worldPos.y,
            isOccupied: false
          }

          this.pathfindingGrid[x][y][z] = node
        }
      }
    }

    // Connect neighbors
    for (let x = 0; x < gridX; x++) {
      for (let y = 0; y < gridY; y++) {
        for (let z = 0; z < gridZ; z++) {
          const node = this.pathfindingGrid[x][y][z]

          // Connect to adjacent nodes
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue

                const nx = x + dx
                const ny = y + dy
                const nz = z + dz

                if (nx >= 0 && nx < gridX && ny >= 0 && ny < gridY && nz >= 0 && nz < gridZ) {
                  const neighbor = this.pathfindingGrid[nx][ny][nz]
                  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
                  neighbor.cost = distance
                  node.neighbors.push(neighbor)
                }
              }
            }
          }
        }
      }
    }
  }

  // Bot Management
  public spawnBot(personalityId?: string, difficultyId?: string, position?: THREE.Vector3): string {
    if (this.activeBots.size >= this.maxBots) {
      return ''
    }

    const personality = personalityId ?
      this.personalities.get(personalityId) :
      Array.from(this.personalities.values())[Math.floor(Math.random() * this.personalities.size)]

    const difficulty = difficultyId ?
      this.difficulties.get(difficultyId) :
      Array.from(this.difficulties.values())[1] // Default to Regular

    if (!personality || !difficulty) return ''

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Find spawn position
    const spawnPos = position || this.findSpawnPosition()
    if (!spawnPos) return ''

    const voiceProfile = Array.from(this.voiceProfiles.values())[Math.floor(Math.random() * this.voiceProfiles.size)]

    const bot: AIBot = {
      id: botId,
      name: `${personality.name} ${Math.floor(Math.random() * 999)}`,
      personality,
      difficulty,
      position: spawnPos.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      health: 100 * difficulty.healthMultiplier,
      maxHealth: 100 * difficulty.healthMultiplier,
      armor: 0,
      isAlive: true,
      currentWeapon: personality.preferredWeapon[0],
      ammo: 30,
      grenades: 2,
      equipment: [],

      currentState: 'idle',
      target: null,
      lastKnownPlayerPosition: null,
      alertLevel: 0,
      morale: 100,
      stamina: 100,

      pathfinding: [],
      currentPathIndex: 0,
      coverPositions: [],
      currentCover: null,

      isAiming: false,
      isFiring: false,
      lastShotTime: 0,
      burstFireCount: 0,
      reloadTime: 0,

      behaviorTimer: 0,
      nextDecisionTime: Date.now() + Math.random() * 2000,
      combatStyle: personality.movementPattern === 'aggressive' ? 'aggressive' : 'defensive',
      engagementRange: personality.movementPattern === 'tactical' ? 40 : 25,

      experience: 0,
      kills: 0,
      deaths: 0,
      accuracy: 0,
      survivalTime: 0,
      learnedPatterns: new Map<string, any>(),

      teamId: 'bot_team',
      squadPosition: 'lone_wolf',
      isFollowingOrders: false,
      orders: [],

      animations: new Map<string, any>(),
      currentAnimation: 'idle',

      voiceProfile,
      lastAudioTime: 0
    }

    this.bots.set(botId, bot)
    this.activeBots.add(botId)

    // Create bot mesh
    this.createBotMesh(bot)

    // Initialize bot behavior
    this.initializeBotBehavior(bot)

    return botId
  }

  private findSpawnPosition(): THREE.Vector3 | null {
    const maxAttempts = 50

    for (let i = 0; i < maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = 20 + Math.random() * 30

      const position = new THREE.Vector3(
        Math.cos(angle) * distance,
        1.8,
        Math.sin(angle) * distance
      )

      // Check if position is valid (not too close to player or other bots)
      if (this.isValidSpawnPosition(position)) {
        return position
      }
    }

    return null
  }

  private isValidSpawnPosition(position: THREE.Vector3): boolean {
    // Check distance from player
    const playerDist = position.distanceTo(this.playerPosition)
    if (playerDist < 15) return false

    // Check distance from other bots
    for (const bot of this.bots.values()) {
      if (bot.isAlive && position.distanceTo(bot.position) < 5) {
        return false
      }
    }

    // Check if position is within map bounds
    return this.mapBounds.containsPoint(position)
  }

  private createBotMesh(bot: AIBot): void {
    const group = new THREE.Group()

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bot.personality.color,
      roughness: 0.7
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.8
    group.add(body)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.8
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.6
    group.add(head)

    // Weapon indicator
    const weaponGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05)
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5
    })
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial)
    weapon.position.set(0.3, 1.2, 0.2)
    weapon.rotation.z = -0.3
    group.add(weapon)

    group.position.copy(bot.position)
    group.castShadow = true
    group.receiveShadow = true

    this.scene.add(group)
    bot.mesh = group
  }

  private initializeBotBehavior(bot: AIBot): void {
    // Set initial state based on personality
    if (bot.personality.movementPattern === 'aggressive') {
      bot.currentState = 'patrolling'
      bot.behaviorTimer = Date.now() + Math.random() * 5000
    } else if (bot.personality.movementPattern === 'defensive') {
      bot.currentState = 'idle'
      // this.findCoverPosition(bot) // Method not implemented yet
    } else {
      bot.currentState = 'patrolling'
      bot.behaviorTimer = Date.now() + Math.random() * 3000
    }

    // Learn initial map knowledge
    this.learnMapKnowledge(bot)
  }

  // AI Update Loop
  public update(deltaTime: number, playerPosition: THREE.Vector3, playerVelocity: THREE.Vector3): void {
    this.playerPosition.copy(playerPosition)
    this.playerVelocity.copy(playerVelocity)

    const currentTime = Date.now()

    // Update AI at fixed intervals
    if (currentTime - this.lastAIUpdate > this.aiUpdateTime) {
      this.updateAI(currentTime)
      this.lastAIUpdate = currentTime
    }

    // Update learning
    if (this.isLearningEnabled && currentTime - this.lastLearningUpdate > this.learningUpdateInterval) {
      this.updateLearning(currentTime)
      this.lastLearningUpdate = currentTime
    }

    // Update bot animations and physics
    this.updateBotPhysics(deltaTime)
    this.updateBotAnimations(deltaTime)

    // Manage bot spawning/despawning
    this.manageBotPopulation()
  }

  private updateAI(currentTime: number): void {
    for (const bot of this.bots.values()) {
      if (!bot.isAlive) continue

      // Update awareness
      this.updateBotAwareness(bot)

      // Make decisions
      if (currentTime >= bot.nextDecisionTime) {
        this.makeBotDecision(bot)
        bot.nextDecisionTime = currentTime + (500 + Math.random() * 1500) // 0.5-2 seconds
      }

      // Execute current behavior
      this.executeBotBehavior(bot)

      // Update bot state
      this.updateBotState(bot)

      // Team coordination
      if (this.aiSettings.enableTeamwork) {
        this.updateTeamCoordination(bot)
      }
    }
  }

  private updateBotAwareness(bot: AIBot): void {
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition)

    // Check if bot can see player
    const canSeePlayer = this.canBotSeePlayer(bot)

    if (canSeePlayer) {
      bot.lastKnownPlayerPosition = this.playerPosition.clone()
      bot.alertLevel = Math.min(100, bot.alertLevel + 10)

      if (bot.currentState === 'idle' || bot.currentState === 'patrolling') {
        bot.currentState = 'engaging'
        bot.target = this.playerPosition.clone()
      }
    } else if (bot.lastKnownPlayerPosition) {
      // Player was seen but is now hidden
      const timeSinceLastSeen = Date.now() - (bot.lastKnownPlayerPosition as any).timestamp

      if (timeSinceLastSeen > 5000) { // 5 seconds
        bot.currentState = 'searching'
        bot.alertLevel = Math.max(0, bot.alertLevel - 5)
      }
    } else {
      bot.alertLevel = Math.max(0, bot.alertLevel - 2)
    }

    // Update morale based on health and combat situation
    if (bot.health < bot.maxHealth * 0.3) {
      bot.morale = Math.max(0, bot.morale - 5)
    } else if (bot.health > bot.maxHealth * 0.8) {
      bot.morale = Math.min(100, bot.morale + 2)
    }
  }

  private canBotSeePlayer(bot: AIBot): boolean {
    const distance = bot.position.distanceTo(this.playerPosition)

    // Check distance
    if (distance > bot.difficulty.visionRange) return false

    // Check line of sight
    const direction = this.playerPosition.clone().sub(bot.position).normalize()
    const raycaster = new THREE.Raycaster(bot.position, direction)

    // In a real implementation, you'd check against actual level geometry
    // For now, just check distance and some randomness based on bot accuracy
    const accuracyThreshold = (bot.personality.accuracy + bot.difficulty.accuracyBonus) / 100
    const randomFactor = Math.random()

    return randomFactor < accuracyThreshold
  }

  private makeBotDecision(bot: AIBot): void {
    const currentState = bot.currentState

    // Decision making based on personality and current situation
    switch (currentState) {
      case 'idle':
        this.decideFromIdle(bot)
        break
      case 'patrolling':
        this.decideFromPatrolling(bot)
        break
      case 'engaging':
        this.decideFromEngaging(bot)
        break
      case 'taking_cover':
        this.decideFromCover(bot)
        break
      case 'searching':
        this.decideFromSearching(bot)
        break
      case 'reloading':
        this.decideFromReloading(bot)
        break
      default:
        // Default behavior
        if (bot.alertLevel > 50) {
          bot.currentState = 'engaging'
        } else {
          bot.currentState = 'patrolling'
        }
    }

    // Learn from this decision
    if (this.isLearningEnabled) {
      this.learnFromDecision(bot, currentState, bot.currentState)
    }
  }

  private decideFromIdle(bot: AIBot): void {
    if (bot.alertLevel > 30) {
      bot.currentState = 'patrolling'
    } else if (Math.random() > 0.7) {
      // Occasionally move to better position
      // bot.findBetterPosition() // Method not implemented yet
    }
  }

  private decideFromPatrolling(bot: AIBot): void {
    if (bot.alertLevel > 70) {
      bot.currentState = 'engaging'
    } else if (Math.random() > 0.8) {
      // Change patrol direction
      this.generatePatrolPath(bot)
    }
  }

  private decideFromEngaging(bot: AIBot): void {
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition)

    // Check ammo
    if (bot.ammo <= 0) {
      bot.currentState = 'reloading'
      return
    }

    // Check health
    if (bot.health < bot.maxHealth * 0.3 && bot.morale < 30) {
      bot.currentState = 'retreating'
      return
    }

    // Tactical decisions based on personality
    if (bot.personality.movementPattern === 'aggressive') {
      if (distanceToPlayer > bot.engagementRange) {
        bot.target = this.playerPosition.clone()
      }
    } else if (bot.personality.movementPattern === 'defensive') {
      if (distanceToPlayer < 15 && !bot.currentCover) {
        bot.currentState = 'covering'
        this.findCoverPosition(bot)
      }
    } else if (bot.personality.movementPattern === 'tactical') {
      if (Math.random() > 0.7) {
        bot.currentState = 'flanking'
        this.generateFlankingPath(bot)
      }
    }

    // Team coordination decisions
    if (this.aiSettings.enableTeamwork && bot.squadPosition !== 'lone_wolf') {
      this.coordinateWithTeam(bot)
    }
  }

  private decideFromCover(bot: AIBot): void {
    if (bot.reloadTime > 0) {
      // Stay in cover while reloading
      return
    }

    const distanceToPlayer = bot.position.distanceTo(this.playerPosition)

    if (distanceToPlayer > 30) {
      // Player is far, advance
      bot.currentState = 'engaging'
    } else if (bot.ammo > 10 && bot.morale > 50) {
      // Good opportunity to attack
      bot.currentState = 'engaging'
    } else if (bot.currentCover && distanceToPlayer < 10) {
      // Too close to current cover, find new position
      this.findCoverPosition(bot)
    }
  }

  private decideFromSearching(bot: AIBot): void {
    if (bot.lastKnownPlayerPosition) {
      // Move to last known position
      bot.target = bot.lastKnownPlayerPosition.clone()

      const distanceToTarget = bot.position.distanceTo(bot.target)
      if (distanceToTarget < 2) {
        // Reached last known position, didn't find player
        bot.lastKnownPlayerPosition = null
        bot.currentState = 'patrolling'
      }
    } else {
      bot.currentState = 'patrolling'
    }
  }

  private decideFromReloading(bot: AIBot): void {
    if (bot.reloadTime <= 0) {
      // Reload complete
      if (bot.alertLevel > 50) {
        bot.currentState = 'engaging'
      } else {
        bot.currentState = 'covering'
      }
    }
  }

  private executeBotBehavior(bot: AIBot): void {
    switch (bot.currentState) {
      case 'patrolling':
        this.executePatrolling(bot)
        break
      case 'engaging':
        this.executeEngaging(bot)
        break
      case 'taking_cover':
        this.executeTakingCover(bot)
        break
      case 'searching':
        this.executeSearching(bot)
        break
      case 'reloading':
        this.executeReloading(bot)
        break
      case 'flanking':
        this.executeFlanking(bot)
        break
      case 'retreating':
        this.executeRetreating(bot)
        break
    }
  }

  private executePatrolling(bot: AIBot): void {
    if (bot.pathfinding.length === 0 || bot.currentPathIndex >= bot.pathfinding.length) {
      this.generatePatrolPath(bot)
    }

    if (bot.pathfinding.length > 0) {
      const targetNode = bot.pathfinding[bot.currentPathIndex]
      const direction = targetNode.position.clone().sub(bot.position).normalize()

      // Move towards target
      const moveSpeed = 2.0 * (bot.stamina / 100)
      bot.velocity.copy(direction.multiplyScalar(moveSpeed))

      // Check if reached target
      const distanceToTarget = bot.position.distanceTo(targetNode.position)
      if (distanceToTarget < 1) {
        bot.currentPathIndex++
      }
    }
  }

  private executeEngaging(bot: AIBot): void {
    if (!bot.target) {
      bot.target = this.playerPosition.clone()
    }

    const distanceToTarget = bot.position.distanceTo(bot.target)

    // Aim at target
    const direction = bot.target.clone().sub(bot.position).normalize()
    this.lookAt(bot, direction)

    // Movement based on personality
    if (bot.personality.movementPattern === 'aggressive') {
      // Move closer
      if (distanceToTarget > bot.engagementRange * 0.7) {
        const moveDirection = direction.clone().multiplyScalar(2.0)
        bot.velocity.copy(moveDirection)
      } else {
        bot.velocity.set(0, 0, 0)
      }
    } else if (bot.personality.movementPattern === 'defensive') {
      // Maintain optimal range
      if (distanceToTarget < bot.engagementRange * 0.5) {
        const moveDirection = direction.clone().multiplyScalar(-1.5)
        bot.velocity.copy(moveDirection)
      } else if (distanceToTarget > bot.engagementRange * 1.5) {
        const moveDirection = direction.clone().multiplyScalar(1.0)
        bot.velocity.copy(moveDirection)
      } else {
        bot.velocity.set(0, 0, 0)
      }
    }

    // Combat behavior
    if (distanceToTarget < bot.engagementRange && bot.ammo > 0) {
      bot.isAiming = true

      // Fire based on accuracy and personality
      const fireChance = (bot.personality.accuracy + bot.difficulty.accuracyBonus) / 100
      const currentTime = Date.now()

      if (Math.random() < fireChance && currentTime - bot.lastShotTime > 200) {
        (bot as any).fire()
        bot.lastShotTime = currentTime
      }
    } else {
      bot.isAiming = false
    }
  }

  private executeTakingCover(bot: AIBot): void {
    if (!bot.currentCover) {
      this.findCoverPosition(bot)
      return
    }

    const distanceToCover = bot.position.distanceTo(bot.currentCover)

    if (distanceToCover > 1) {
      // Move to cover
      const direction = bot.currentCover.clone().sub(bot.position).normalize()
      bot.velocity.copy(direction.multiplyScalar(3.0))
    } else {
      // In cover
      bot.velocity.set(0, 0, 0)

      // Reload if needed
      if (bot.ammo < 10 && bot.reloadTime <= 0) {
        (bot as any).startReload()
      }

      // Peek and fire if safe
      if (bot.ammo > 0 && Math.random() > 0.7) {
        bot.isAiming = true
        if (this.canBotSeePlayer(bot)) {
          (bot as any).fire()
        }
      } else {
        bot.isAiming = false
      }
    }
  }

  private executeSearching(bot: AIBot): void {
    if (!bot.target) return

    const direction = bot.target.clone().sub(bot.position).normalize()
    bot.velocity.copy(direction.multiplyScalar(2.5))
    this.lookAt(bot, direction)

    // Look around while searching
    const lookOffset = Math.sin(Date.now() * 0.001) * 0.5
    bot.rotation.y += lookOffset
  }

  private executeReloading(bot: AIBot): void {
    bot.velocity.set(0, 0, 0)
    bot.isAiming = false

    if (bot.reloadTime > 0) {
      bot.reloadTime -= 16 // Assuming 60 FPS
    }
  }

  private executeFlanking(bot: AIBot): void {
    if (bot.pathfinding.length === 0) {
      this.generateFlankingPath(bot)
      return
    }

    const targetNode = bot.pathfinding[bot.currentPathIndex]
    const direction = targetNode.position.clone().sub(bot.position).normalize()

    bot.velocity.copy(direction.multiplyScalar(2.5))
    this.lookAt(bot, direction)

    const distanceToTarget = bot.position.distanceTo(targetNode.position)
    if (distanceToTarget < 1) {
      bot.currentPathIndex++

      if (bot.currentPathIndex >= bot.pathfinding.length) {
        // Reached flanking position
        bot.currentState = 'engaging'
        bot.target = this.playerPosition.clone()
      }
    }
  }

  private executeRetreating(bot: AIBot): void {
    // Move away from player
    const direction = bot.position.clone().sub(this.playerPosition).normalize()
    bot.velocity.copy(direction.multiplyScalar(3.5))
    bot.isAiming = false

    // Find health or support if available
    if (bot.health < bot.maxHealth * 0.2) {
      this.searchForHealth(bot)
    }

    // Stop retreating if safe distance reached
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition)
    if (distanceToPlayer > 40) {
      bot.currentState = 'covering'
      this.findCoverPosition(bot)
    }
  }

  private updateBotState(bot: AIBot): void {
    // Update stamina
    if (bot.velocity.length() > 0) {
      bot.stamina = Math.max(0, bot.stamina - 0.1)
    } else {
      bot.stamina = Math.min(100, bot.stamina + 0.2)
    }

    // Update experience
    bot.experience += 0.1

    // Update survival time
    bot.survivalTime += 0.016 // ~60 FPS

    // Update animations
    this.updateBotAnimation(bot)
  }

  private updateBotAnimation(bot: AIBot): void {
    if (!bot.mesh) return

    let animation = 'idle'

    if (!bot.isAlive) {
      animation = 'dead'
    } else if (bot.velocity.length() > 0.1) {
      animation = bot.velocity.length() > 2 ? 'running' : 'walking'
    } else if (bot.isAiming) {
      animation = 'aiming'
    } else if (bot.isFiring) {
      animation = 'firing'
    } else if (bot.reloadTime > 0) {
      animation = 'reloading'
    }

    if (animation !== bot.currentAnimation) {
      bot.currentAnimation = animation
      // Update actual animation on mesh
    }
  }

  private updateBotPhysics(deltaTime: number): void {
    for (const bot of this.bots.values()) {
      if (!bot.isAlive || !bot.mesh) continue

      // Apply gravity
      bot.velocity.y -= 9.81 * deltaTime

      // Update position
      bot.position.add(bot.velocity.clone().multiplyScalar(deltaTime))

      // Ground collision
      if (bot.position.y < 1.8) {
        bot.position.y = 1.8
        bot.velocity.y = 0
      }

      // Update mesh
      bot.mesh.position.copy(bot.position)
      bot.mesh.rotation.copy(bot.rotation)
    }
  }

  private updateBotAnimations(deltaTime: number): void {
    // Update animation states and transitions
    for (const bot of this.bots.values()) {
      if (!bot.mesh) continue

      // Handle animation blending and transitions
      // This would integrate with actual animation system
    }
  }

  private updateTeamCoordination(bot: AIBot): void {
    // Coordinate with nearby friendly bots
    const nearbyBots = this.getNearbyBots(bot, 20)

    for (const nearbyBot of nearbyBots) {
      if (nearbyBot.teamId === bot.teamId) {
        // Share information
        if (bot.lastKnownPlayerPosition && !nearbyBot.lastKnownPlayerPosition) {
          nearbyBot.lastKnownPlayerPosition = bot.lastKnownPlayerPosition.clone()
          nearbyBot.alertLevel = Math.max(nearbyBot.alertLevel, bot.alertLevel * 0.8)
        }

        // Coordinate attacks
        if (bot.currentState === 'engaging' && nearbyBot.currentState === 'idle') {
          nearbyBot.currentState = 'engaging'
          nearbyBot.target = bot.target?.clone() || null
        }

        // Provide covering fire
        if (bot.currentState === 'reloading' && nearbyBot.currentState === 'engaging') {
          nearbyBot.combatStyle = 'defensive'
        }
      }
    }
  }

  private coordinateWithTeam(bot: AIBot): void {
    // Execute team orders and coordinate actions
    for (const order of bot.orders) {
      if (!order.isCompleted && order.priority > 5) {
        this.executeOrder(bot, order)
        break
      }
    }
  }

  private executeOrder(bot: AIBot, order: AIOrder): void {
    switch (order.type) {
      case 'attack':
        if (order.target) {
          bot.currentState = 'engaging'
          bot.target = order.target.clone()
        }
        break
      case 'defend':
        if (order.target) {
          bot.currentState = 'covering'
          bot.currentCover = order.target.clone()
        }
        break
      case 'patrol':
        bot.currentState = 'patrolling'
        break
      case 'support':
        // Find and support nearby teammates
        break
    }
  }

  // Learning System
  private updateLearning(currentTime: number): void {
    if (!this.isLearningEnabled) return

    // Update player pattern learning
    this.updatePlayerPatternLearning()

    // Update map knowledge
    this.updateMapKnowledge()

    // Update tactical learning
    this.updateTacticalLearning()

    // Adapt AI behavior based on learning
    this.adaptAIBehavior()
  }

  private updatePlayerPatternLearning(): void {
    const playerId = 'player_1'
    let pattern = this.learningData.playerPatterns.get(playerId)

    if (!pattern) {
      pattern = {
        movementStyle: 'cautious',
        preferredPositions: [],
        reactionTendencies: new Map<string, number>(),
        weaponUsage: new Map<string, number>(),
        accuracyTrend: [],
        lastEncounters: []
      }
      this.learningData.playerPatterns.set(playerId, pattern)
    }

    // Analyze player movement
    const movementSpeed = this.playerVelocity.length()
    if (movementSpeed > 5) {
      pattern.movementStyle = 'aggressive'
    } else if (movementSpeed < 2) {
      pattern.movementStyle = 'cautious'
    }

    // Track preferred positions
    pattern.preferredPositions.push(this.playerPosition.clone())
    if (pattern.preferredPositions.length > 50) {
      pattern.preferredPositions.shift()
    }

    // Update reaction tendencies
    // This would track how player reacts to different situations
  }

  private updateMapKnowledge(): void {
    // Update AI knowledge of the map based on experiences
    for (const bot of this.bots.values()) {
      if (!bot.isAlive) continue

      const mapKey = 'current_map'
      let mapKnowledge = this.learningData.mapKnowledge.get(mapKey)

      if (!mapKnowledge) {
        mapKnowledge = {
          positions: new Map<string, any>(),
          coverSpots: [],
          dangerZones: [],
          strategicPoints: [],
          spawnPoints: [],
          objectives: []
        }
        this.learningData.mapKnowledge.set(mapKey, mapKnowledge)
      }

      // Learn about positions
      const posKey = `${Math.floor(bot.position.x / 5)},${Math.floor(bot.position.z / 5)}`
      let posData = mapKnowledge.positions.get(posKey)

      if (!posData) {
        posData = {
          visits: 0,
          successRate: 0,
          dangerLevel: 0,
          lastVisited: Date.now(),
          encounters: 0
        }
        mapKnowledge.positions.set(posKey, posData)
      }

      posData.visits++
      posData.lastVisited = Date.now()

      // Learn about danger zones
      if (bot.health < bot.maxHealth * 0.5) {
        mapKnowledge.dangerZones.push(bot.position.clone())
        if (mapKnowledge.dangerZones.length > 100) {
          mapKnowledge.dangerZones.shift()
        }
      }
    }
  }

  private updateTacticalLearning(): void {
    // Learn which tactics work and which don't
    for (const bot of this.bots.values()) {
      if (!bot.isAlive) {
        // Analyze what led to death
        const causeOfDeath = this.analyzeBotDeath(bot)
        const tacticKey = `${bot.currentState}_${bot.combatStyle}`

        let failedCount = this.learningData.failedTactics.get(tacticKey) || 0
        this.learningData.failedTactics.set(tacticKey, failedCount + 1)
      } else if (bot.kills > 0) {
        // Analyze successful tactics
        const tacticKey = `${bot.currentState}_${bot.combatStyle}`

        let successCount = this.learningData.successfulTactics.get(tacticKey) || 0
        this.learningData.successfulTactics.set(tacticKey, successCount + 1)
      }
    }
  }

  private adaptAIBehavior(): void {
    // Adapt AI behavior based on learning data
    for (const bot of this.bots.values()) {
      if (bot.personality.learningRate < 50) continue

      // Adapt based on player patterns
      const playerPattern = this.learningData.playerPatterns.get('player_1')
      if (playerPattern) {
        if (playerPattern.movementStyle === 'aggressive') {
          // Player is aggressive, adjust bot behavior
          if (bot.personality.movementPattern === 'defensive') {
            bot.engagementRange = Math.max(15, bot.engagementRange - 2)
          }
        }
      }

      // Adapt based on tactical success
      const currentTactic = `${bot.currentState}_${bot.combatStyle}`
      const successRate = this.calculateTacticSuccessRate(currentTactic)

      if (successRate < 0.3) {
        // Tactic is failing, try something different
        this.adjustBotTactic(bot)
      }
    }
  }

  private calculateTacticSuccessRate(tacticKey: string): number {
    const successes = this.learningData.successfulTactics.get(tacticKey) || 0
    const failures = this.learningData.failedTactics.get(tacticKey) || 0
    const total = successes + failures

    return total > 0 ? successes / total : 0.5
  }

  private adjustBotTactic(bot: AIBot): void {
    // Adjust bot's combat style or approach
    if (bot.combatStyle === 'aggressive') {
      bot.combatStyle = 'defensive'
    } else if (bot.combatStyle === 'defensive') {
      bot.combatStyle = 'tactical'
    } else {
      bot.combatStyle = 'aggressive'
    }

    // Adjust engagement range
    bot.engagementRange += (Math.random() - 0.5) * 10
    bot.engagementRange = Math.max(15, Math.min(50, bot.engagementRange))
  }

  private learnFromDecision(bot: AIBot, previousState: AIState, newState: AIState): void {
    // Learn from state transitions and their outcomes
    const transitionKey = `${previousState}_${newState}`
    bot.learnedPatterns.set(transitionKey, (bot.learnedPatterns.get(transitionKey) || 0) + 1)
  }

  private learnMapKnowledge(bot: AIBot): void {
    // Initial map knowledge learning
    const scanRadius = 20
    const scanPoints = 8

    for (let i = 0; i < scanPoints; i++) {
      const angle = (i / scanPoints) * Math.PI * 2
      const distance = 5 + Math.random() * (scanRadius - 5)

      const checkPos = new THREE.Vector3(
        bot.position.x + Math.cos(angle) * distance,
        bot.position.y,
        bot.position.z + Math.sin(angle) * distance
      )

      // Check if position is valid and add to knowledge
      if (this.mapBounds.containsPoint(checkPos)) {
        // This would check against actual level geometry
        bot.coverPositions.push(checkPos)
      }
    }
  }

  // Bot Action Methods
  private fire(): void {
    // Bot firing logic
    // This would integrate with the weapon system
  }

  private startReload(): void {
    // Bot reload logic
    // This would integrate with the weapon system
  }

  private lookAt(bot: AIBot, direction: THREE.Vector3): void {
    // Bot rotation logic
    const targetRotation = Math.atan2(direction.x, direction.z)
    bot.rotation.y = targetRotation
  }

  private findCoverPosition(bot: AIBot): void {
    // Find nearby cover positions
    const coverRadius = 15
    let bestCover: THREE.Vector3 | null = null
    let bestScore = -Infinity

    for (const coverPos of this.coverPositions) {
      const distance = bot.position.distanceTo(coverPos)
      if (distance > coverRadius) continue

      // Score based on distance to player and cover quality
      const distanceToPlayer = coverPos.distanceTo(this.playerPosition)
      const score = distanceToPlayer - distance

      if (score > bestScore) {
        bestScore = score
        bestCover = coverPos
      }
    }

    if (bestCover) {
      bot.currentCover = bestCover
    }
  }

  private findBetterPosition(bot: AIBot): void {
    // Find a better tactical position
    const searchRadius = 20
    const candidates: THREE.Vector3[] = []

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const distance = 10 + Math.random() * 10

      const candidate = new THREE.Vector3(
        bot.position.x + Math.cos(angle) * distance,
        bot.position.y,
        bot.position.z + Math.sin(angle) * distance
      )

      if (this.mapBounds.containsPoint(candidate)) {
        candidates.push(candidate)
      }
    }

    if (candidates.length > 0) {
      const best = candidates[Math.floor(Math.random() * candidates.length)]
      bot.target = best
    }
  }

  private generatePatrolPath(bot: AIBot): void {
    // Generate a patrol path
    const pathLength = 3 + Math.floor(Math.random() * 5)
    bot.pathfinding = []
    bot.currentPathIndex = 0

    let currentPos = bot.position.clone()

    for (let i = 0; i < pathLength; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = 10 + Math.random() * 20

      const nextPos = new THREE.Vector3(
        currentPos.x + Math.cos(angle) * distance,
        currentPos.y,
        currentPos.z + Math.sin(angle) * distance
      )

      if (this.mapBounds.containsPoint(nextPos)) {
        bot.pathfinding.push({
          position: nextPos,
          cost: 1,
          neighbors: [],
          isCover: false,
          height: nextPos.y,
          isOccupied: false
        })
        currentPos.copy(nextPos)
      }
    }
  }

  private generateFlankingPath(bot: AIBot): void {
    // Generate a flanking path around the player
    const flankingAngle = this.playerPosition.clone().sub(bot.position).normalize()
    const perpAngle = new THREE.Vector3(-flankingAngle.z, 0, flankingAngle.x)

    const flankDistance = 25 + Math.random() * 15
    const flankPos = this.playerPosition.clone().add(perpAngle.multiplyScalar(flankDistance))

    bot.pathfinding = [{
      position: flankPos,
      cost: 1,
      neighbors: [],
      isCover: false,
      height: flankPos.y,
      isOccupied: false
    }]
    bot.currentPathIndex = 0
  }

  private searchForHealth(bot: AIBot): void {
    // Search for health items or medics
    // This would integrate with the game's item system
  }

  private analyzeBotDeath(bot: AIBot): string {
    // Analyze what caused the bot's death
    return 'unknown'
  }

  private getNearbyBots(bot: AIBot, radius: number): AIBot[] {
    const nearby: AIBot[] = []

    for (const otherBot of this.bots.values()) {
      if (otherBot.id === bot.id || !otherBot.isAlive) continue

      const distance = bot.position.distanceTo(otherBot.position)
      if (distance <= radius) {
        nearby.push(otherBot)
      }
    }

    return nearby
  }

  private manageBotPopulation(): void {
    // Spawn new bots if needed
    const currentBotCount = this.activeBots.size
    const targetBotCount = Math.min(this.aiSettings.maxConcurrentBots, this.maxBots)

    if (currentBotCount < targetBotCount) {
      const botsToSpawn = targetBotCount - currentBotCount
      for (let i = 0; i < botsToSpawn; i++) {
        this.spawnBot()
      }
    }

    // Despawn distant bots
    for (const botId of this.activeBots) {
      const bot = this.bots.get(botId)
      if (bot && bot.position.distanceTo(this.playerPosition) > this.botDespawnRadius) {
        this.despawnBot(botId)
      }
    }
  }

  public despawnBot(botId: string): void {
    const bot = this.bots.get(botId)
    if (!bot) return

    // Remove mesh
    if (bot.mesh) {
      this.scene.remove(bot.mesh)
    }

    // Remove from active set
    this.activeBots.delete(botId)

    // Keep bot data for learning, but mark as inactive
    bot.isAlive = false
  }

  // Public API Methods
  public getBotCount(): number {
    return this.activeBots.size
  }

  public getBots(): AIBot[] {
    return Array.from(this.bots.values()).filter(bot => bot.isAlive)
  }

  public getPersonalities(): AIPersonality[] {
    return Array.from(this.personalities.values())
  }

  public getDifficulties(): AIDifficulty[] {
    return Array.from(this.difficulties.values())
  }

  public setDifficulty(difficultyId: string): void {
    const difficulty = this.difficulties.get(difficultyId)
    if (!difficulty) return

    // Update all bots to new difficulty
    for (const bot of this.bots.values()) {
      bot.difficulty = difficulty
      bot.health = bot.maxHealth * difficulty.healthMultiplier
    }
  }

  public enableLearning(enabled: boolean): void {
    this.isLearningEnabled = enabled
  }

  public getLearningData(): AILearningData {
    return { ...this.learningData }
  }

  public clearAllBots(): void {
    for (const botId of Array.from(this.activeBots)) {
      this.despawnBot(botId)
    }
    this.bots.clear()
    this.activeBots.clear()
  }

  public destroy(): void {
    this.clearAllBots()
    this.personalities.clear()
    this.difficulties.clear()
    this.voiceProfiles.clear()
    this.learningData.playerPatterns.clear()
    this.learningData.successfulTactics.clear()
    this.learningData.failedTactics.clear()
    this.learningData.mapKnowledge.clear()
  }
}

// React Component for AI System UI
export function GLXYAIEnemiesUI() {
  const [aiSystem, setAISystem] = useState<GLXYAIEnemies | null>(null)
  const [botCount, setBotCount] = useState(0)
  const [selectedPersonality, setSelectedPersonality] = useState<string>('aggressive_assault')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('regular')
  const [isLearningEnabled, setIsLearningEnabled] = useState(true)

  useEffect(() => {
    // Initialize AI system when scene is available
    // This would be integrated with your Three.js scene setup
  }, [])

  const spawnBot = () => {
    if (aiSystem) {
      const botId = aiSystem.spawnBot(selectedPersonality, selectedDifficulty)
      if (botId) {
        setBotCount(aiSystem.getBotCount())
      }
    }
  }

  const spawnMultipleBots = (count: number) => {
    if (aiSystem) {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          aiSystem.spawnBot(selectedPersonality, selectedDifficulty)
          setBotCount(aiSystem.getBotCount())
        }, i * 200)
      }
    }
  }

  const clearAllBots = () => {
    if (aiSystem) {
      aiSystem.clearAllBots()
      setBotCount(0)
    }
  }

  const getRarityColor = (difficulty: string) => {
    switch (difficulty) {
      case 'recruit': return 'bg-green-500'
      case 'regular': return 'bg-blue-500'
      case 'veteran': return 'bg-purple-500'
      case 'elite': return 'bg-orange-500'
      case 'nightmare': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">GLXY AI Enemies System</h1>
        <p className="text-gray-300">Advanced AI opponents with learning and adaptive behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Personality</Label>
              <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiSystem?.getPersonalities().map(personality => (
                    <SelectItem key={personality.id} value={personality.id}>
                      <div className="flex items-center gap-2">
                        <span>{personality.icon}</span>
                        <span>{personality.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiSystem?.getDifficulties().map(difficulty => (
                    <SelectItem key={difficulty.id} value={difficulty.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getRarityColor(difficulty.id)}`} />
                        <span>{difficulty.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Learning System</Label>
              <Switch
                checked={isLearningEnabled}
                onCheckedChange={(enabled) => {
                  setIsLearningEnabled(enabled)
                  aiSystem?.enableLearning(enabled)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Active Bots: {botCount}</Label>
              <Progress value={(botCount / 16) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={spawnBot}>
                  <Users className="h-4 w-4 mr-2" />
                  Spawn 1
                </Button>
                <Button size="sm" onClick={() => spawnMultipleBots(5)}>
                  <Users className="h-4 w-4 mr-2" />
                  Spawn 5
                </Button>
                <Button size="sm" onClick={() => spawnMultipleBots(10)}>
                  <Users className="h-4 w-4 mr-2" />
                  Spawn 10
                </Button>
                <Button size="sm" variant="destructive" onClick={clearAllBots}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Personalities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Personalities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiSystem?.getPersonalities().map(personality => (
                <Card key={personality.id} className={`bg-gray-800/50 ${selectedPersonality === personality.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{personality.icon}</span>
                        <h3 className="font-semibold text-white">{personality.name}</h3>
                      </div>
                      <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: personality.color }} />
                    </div>

                    <p className="text-sm text-gray-400 mb-3">{personality.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Aggression:</span>
                        <span className="text-white">{personality.aggressiveness}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy:</span>
                        <span className="text-white">{personality.accuracy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tactical:</span>
                        <span className="text-white">{personality.tacticalThinking}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Teamwork:</span>
                        <span className="text-white">{personality.teamCoordination}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {personality.behaviorTraits.map(trait => (
                        <Badge key={trait} variant="outline" className="text-xs">
                          {trait.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Movement: {personality.movementPattern}
                      </div>
                      <Button
                        size="sm"
                        variant={selectedPersonality === personality.id ? "default" : "outline"}
                        onClick={() => setSelectedPersonality(personality.id)}
                      >
                        {selectedPersonality === personality.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Statistics */}
      <Card className="mt-6 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Statistics & Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-3">Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Bots Spawned:</span>
                  <span className="text-white">{botCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Learning Active:</span>
                  <span className={isLearningEnabled ? 'text-green-400' : 'text-red-400'}>
                    {isLearningEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Update Rate:</span>
                  <span className="text-white">10 Hz</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Adaptive Behavior</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Patterns Learned:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tactics Adapted:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-white">0%</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Team Coordination</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Squads Formed:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Orders Executed:</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Efficiency:</span>
                  <span className="text-white">0%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GLXYAIEnemiesUI