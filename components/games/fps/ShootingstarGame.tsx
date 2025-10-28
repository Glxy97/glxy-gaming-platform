// @ts-nocheck
'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { WeaponCore, WeaponDef } from '@/lib/games/weapons/weapon-core'
import { WeaponSelector } from '@/lib/games/weapons/weapon-selector'
import { WeaponHUD } from './WeaponHUD'
import { WeaponSelectorUI } from './WeaponSelectorUI'
import { Crosshair } from './Crosshair'
import { EffectsManager } from '@/lib/games/vfx/effects'
import { ShootingSystem } from '@/lib/games/shooting-system'
import { PerformanceMonitor } from '@/lib/games/performance-monitor'
import { PerformanceMonitorComponent } from './PerformanceMonitor'
import { SettingsMenu, GameSettings } from './SettingsMenu'
import { IntelligentEnemy } from '@/lib/games/ai/intelligent-enemy'
import { DynamicGameplaySystem } from '@/lib/games/gameplay/dynamic-gameplay'
import { IntelligentWeaponSystem } from '@/lib/games/weapons/intelligent-weapon-system'
import { AdaptiveDifficultySystem } from '@/lib/games/difficulty/adaptive-difficulty'
import { IntelligentLevelGenerator } from '@/lib/games/levels/intelligent-level-generator'
import { SimpleLevelGenerator } from '@/lib/games/levels/simple-level-generator'

// Define missing interfaces
interface LevelData {
  id: string
  name: string
  spawnPoints: Array<{
    id: string
    position: THREE.Vector3
    rotation: THREE.Euler
    team: string
    type?: string
  }>
  objectives: any[]
  environment?: {
    hazards?: {
      positions: any[]
    }
    terrain?: any[]
    structures?: any[]
    props?: any[]
  }
}

// Extend WeaponDef interface to include category
interface ExtendedWeaponDef extends WeaponDef {
  category?: string
}

interface ShootingstarGameProps {
  className?: string
  gameStarted?: boolean
}

export function ShootingstarGame({ className, gameStarted = false }: ShootingstarGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  // Game state
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const weaponSelectorRef = useRef<WeaponSelector | null>(null)
  const animationRef = useRef<number | null>(null)
  const playerRotationRef = useRef({ x: 0, y: 0 })
  const effectsManagerRef = useRef<EffectsManager | null>(null)
  const shootingSystemRef = useRef<ShootingSystem | null>(null)
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null)
  
  // New intelligent gameplay systems
  const intelligentEnemiesRef = useRef<IntelligentEnemy[]>([])
  const dynamicGameplaySystemRef = useRef<DynamicGameplaySystem | null>(null)
  const intelligentWeaponSystemRef = useRef<IntelligentWeaponSystem | null>(null)
  const adaptiveDifficultySystemRef = useRef<AdaptiveDifficultySystem | null>(null)
  const levelGeneratorRef = useRef<IntelligentLevelGenerator | null>(null)
  
  // Legacy system refs (for compatibility)
  const enemyManagerRef = useRef<any>(null)
  const gameModeManagerRef = useRef<any>(null)
  const statsManagerRef = useRef<any>(null)
  const levelManagerRef = useRef<any>(null)
  const simpleLevelGeneratorRef = useRef<SimpleLevelGenerator | null>(null)
  
  // Input state - vereinfacht und direkter
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false })
  const [mouseDown, setMouseDown] = useState(false)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [mouseMovement, setMouseMovement] = useState({ x: 0, y: 0 })
  
  // Player state
  const [isSprinting, setIsSprinting] = useState(false)
  const [isCrouching, setIsCrouching] = useState(false)
  const [isAiming, setIsAiming] = useState(false)
  const [playerHeight, setPlayerHeight] = useState(1.8)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerScore, setPlayerScore] = useState(0)
  const [playerKills, setPlayerKills] = useState(0)
  const [playerDeaths, setPlayerDeaths] = useState(0)
  
  // Game state
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showGameMenu, setShowGameMenu] = useState(false)
  const [showRoundEndModal, setShowRoundEndModal] = useState(false)
  const [roundEndResult, setRoundEndResult] = useState<'victory' | 'defeat' | 'draw'>('victory')
  const [roundEndStats, setRoundEndStats] = useState({ playerScore: 0, enemyScore: 0, kills: 0, deaths: 0 })
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null)
  const [currentGameMode, setCurrentGameMode] = useState<string>('survival')
  const [gameActive, setGameActive] = useState(false)
  const [waveActive, setWaveActive] = useState(false)
  const [currentWave, setCurrentWave] = useState(0)
  
  // Intelligent game state
  const [aiDifficulty, setAiDifficulty] = useState(1.0)
  const [playerSkillLevel, setPlayerSkillLevel] = useState(0.5)
  const [dynamicObjectives, setDynamicObjectives] = useState<any[]>([])
  const [environmentalHazards, setEnvironmentalHazards] = useState<any[]>([])
  const [intelligentEvents, setIntelligentEvents] = useState<any[]>([])
  const [killLogs, setKillLogs] = useState<Array<{id: string, message: string, timestamp: number}>>([])
  const [showScoreboard, setShowScoreboard] = useState(false)
  
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    graphics: {
      quality: 'high',
      shadows: true,
      effects: true,
      particles: true
    },
    audio: {
      masterVolume: 0.8,
      sfxVolume: 0.9,
      musicVolume: 0.5
    },
    gameplay: {
      mouseSensitivity: 0.002,
      invertMouseY: false,
      autoReload: true,
      crosshairType: 'default'
    },
    controls: {
      keyBindings: {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        jump: ' ',
        crouch: 'control',
        sprint: 'shift',
        reload: 'r',
        fire: 'mouse0'
      }
    }
  })
  
  // Weapon data
  const weaponDefs = useRef<WeaponDef[]>([])
  
  // Handle pointer lock state changes
  useEffect(() => {
    if (showGameMenu || !gameActive) {
      // Release pointer lock when menu is shown or game is not active
      if (isPointerLocked) {
        document.exitPointerLock()
      }
    }
  }, [showGameMenu, gameActive, isPointerLocked])
  
  // Auto-start game when component mounts and gameStarted is true
  useEffect(() => {
    if (mounted && !gameActive && gameStarted) {
      const timer = setTimeout(() => {
        console.log('Auto-starting game...')
        startGame('survival')
      }, 1000) // Reduced delay for faster startup
      return () => clearTimeout(timer)
    }
    return undefined
  }, [mounted, gameActive, gameStarted])
  
  // Auto-request pointer lock when game becomes active
  useEffect(() => {
    if (gameActive && !isPointerLocked && !showGameMenu) {
      const timer = setTimeout(() => {
        console.log('Auto-requesting pointer lock...')
        if (canvasRef.current) {
          try {
            canvasRef.current.requestPointerLock()
          } catch (error) {
            console.error('Failed to auto-request pointer lock:', error)
          }
        }
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [gameActive, isPointerLocked, showGameMenu])
  
  // Initialize game
  useEffect(() => {
    if (!mounted || !gameStarted) return
    
    const initGame = async () => {
      // Load settings first
      loadSettings()
      
      // Load weapon definitions
      await loadWeaponDefinitions()
      
      // Setup Three.js scene
      setupScene()
      
      // Setup gameplay systems
      setupGameplaySystems()
      
      // Setup weapon system
      setupWeapons()
      
      // Setup effects system
      setupEffects()
      
      // Setup shooting system
      setupShooting()
      
      // Setup performance monitor
      setupPerformanceMonitor()
      
      // Setup input handlers
      setupInputHandlers()
      
      // Load initial level
      loadLevel('training_facility')
      
      // Start game loop
      // Start game loop only if game is started
      if (gameStarted) {
        startGameLoop()
      }
    }
    
    initGame()
    
    return () => {
      cleanup()
    }
  }, [mounted, gameStarted])
  
  // Start game loop when game is started
  useEffect(() => {
    if (gameStarted && !animationRef.current) {
      startGameLoop()
    }
  }, [gameStarted])
  
  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
    }
  }, [])

  const setupGameplaySystems = () => {
    if (!sceneRef.current || !cameraRef.current) return

    // Initialize intelligent weapon system
    intelligentWeaponSystemRef.current = new IntelligentWeaponSystem()

    // Initialize dynamic gameplay system
    dynamicGameplaySystemRef.current = new DynamicGameplaySystem(sceneRef.current, cameraRef.current)

    // Initialize adaptive difficulty system
    adaptiveDifficultySystemRef.current = new AdaptiveDifficultySystem({
      skillLevel: playerSkillLevel,
      playStyle: 'balanced'
    })

    // Initialize intelligent level generator
    levelGeneratorRef.current = new IntelligentLevelGenerator()
    
    // Initialize simple level generator as fallback
    simpleLevelGeneratorRef.current = new SimpleLevelGenerator()

    // Initialize intelligent enemies
    intelligentEnemiesRef.current = []
    
    // Initialize legacy system refs for compatibility
    enemyManagerRef.current = {
      getTotalWaves: () => 5,
      getEnemyCount: () => intelligentEnemiesRef.current.filter(enemy => enemy.getState().health > 0).length,
      dispose: () => {
        console.log('Disposing enemy manager...')
        intelligentEnemiesRef.current = []
      }
    }
    
    gameModeManagerRef.current = {
      startGame: () => {},
      endCurrentGame: () => {}
    }
    
    statsManagerRef.current = {
      dispose: () => {}
    }
    
    levelManagerRef.current = {
      dispose: () => {}
    }
    
    // Setup event listeners for dynamic gameplay
    if (dynamicGameplaySystemRef.current) {
      dynamicGameplaySystemRef.current.on('objective_completed', (objective: any) => {
        console.log('Dynamic objective completed:', objective)
        setPlayerScore(prev => prev + objective.rewards?.score || 0)
      })

      dynamicGameplaySystemRef.current.on('event_triggered', (event: any) => {
        console.log('Dynamic event triggered:', event)
        setIntelligentEvents(prev => [...prev, event])
      })
    }
  }

  const loadLevel = (levelId: string) => {
    if (!simpleLevelGeneratorRef.current || !sceneRef.current) return

    console.log('Loading level:', levelId)
    
    // Always use simple level generator for now to avoid errors
    try {
      const level = simpleLevelGeneratorRef.current.generateLevel(
        aiDifficulty,
        playerSkillLevel,
        'balanced',
        600 // 10 minutes estimated play time
      )
      
      console.log('Generated level:', level.name)
      
      // Build level from generated layout
      buildLevelFromLayout(level)
      
      // Spawn intelligent enemies
      spawnIntelligentEnemies(level)
      
      // Set up dynamic objectives
      if (dynamicGameplaySystemRef.current) {
        setDynamicObjectives(level.objectives)
      }
      
      // Set up environmental hazards
      setEnvironmentalHazards(level.environment?.hazards?.positions || [])
      
      // Reset player position to spawn point
      if (level.spawnPoints && level.spawnPoints.length > 0 && cameraRef.current) {
        const spawnPoint = level.spawnPoints.find((spawn: any) => spawn.team === 'player')
        if (spawnPoint) {
          cameraRef.current.position.copy(spawnPoint.position)
          cameraRef.current.rotation.copy(spawnPoint.rotation)
        }
      }
      
      setCurrentLevel(level as any)
    } catch (error) {
      console.error('Simple level generation failed:', error)
      
      // Create fallback level
      createFallbackLevel()
    }
  }

  const createFallbackLevel = () => {
    if (!sceneRef.current || !cameraRef.current) return

    console.log('Creating fallback level')

    // Clear existing objects
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child.userData.isLevelObject
    )
    objectsToRemove.forEach(obj => sceneRef.current?.remove(obj))

    // Create simple ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.userData.isLevelObject = true
    ground.receiveShadow = true
    sceneRef.current.add(ground)

    // Create some simple obstacles
    for (let i = 0; i < 10; i++) {
      const boxGeometry = new THREE.BoxGeometry(2, 2, 2)
      const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      const box = new THREE.Mesh(boxGeometry, boxMaterial)
      box.position.set(
        (Math.random() - 0.5) * 40,
        1,
        (Math.random() - 0.5) * 40
      )
      box.userData.isLevelObject = true
      box.castShadow = true
      box.receiveShadow = true
      sceneRef.current.add(box)
    }

    // Create simple level data
    const fallbackLevel = {
      id: 'fallback_level',
      name: 'Fallback Level',
      spawnPoints: [
        { id: 'player_spawn', position: new THREE.Vector3(0, 1.8, 0), rotation: new THREE.Euler(0, 0, 0), team: 'player' },
        { id: 'enemy_spawn_1', position: new THREE.Vector3(10, 1.8, 10), rotation: new THREE.Euler(0, Math.PI, 0), team: 'enemy' },
        { id: 'enemy_spawn_2', position: new THREE.Vector3(-10, 1.8, -10), rotation: new THREE.Euler(0, Math.PI, 0), team: 'enemy' }
      ],
      objectives: [],
      environment: { hazards: { positions: [] } }
    }

    // Spawn simple enemies
    spawnIntelligentEnemies(fallbackLevel)
    
    setCurrentLevel(fallbackLevel as any)
  }

  const buildLevelFromLayout = (level: any) => {
    if (!sceneRef.current) return

    console.log('Building level from layout:', level.name)

    // Clear existing level objects
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child.userData.isLevelObject
    )
    objectsToRemove.forEach(obj => sceneRef.current?.remove(obj))

    // Build terrain
    if (level.environment && level.environment.terrain) {
      level.environment.terrain.forEach((terrain: any) => {
        createTerrainObject(terrain)
      })
    }

    // Build structures
    if (level.environment && level.environment.structures) {
      level.environment.structures.forEach((structure: any) => {
        createStructureObject(structure)
      })
    }

    // Build props
    if (level.environment && level.environment.props) {
      level.environment.props.forEach((prop: any) => {
        createPropObject(prop)
      })
    }

    console.log('Level built successfully')
  }

  const createTerrainObject = (terrain: any) => {
    if (!sceneRef.current) return

    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    switch (terrain.type) {
      case 'ground':
        geometry = new THREE.PlaneGeometry(terrain.scale.x, terrain.scale.z)
        material = new THREE.MeshLambertMaterial({ color: terrain.material.color })
        break
      case 'wall':
        geometry = new THREE.BoxGeometry(terrain.scale.x, terrain.scale.y, terrain.scale.z)
        material = new THREE.MeshLambertMaterial({ color: terrain.material.color })
        break
      default:
        geometry = new THREE.BoxGeometry(terrain.scale.x, terrain.scale.y, terrain.scale.z)
        material = new THREE.MeshLambertMaterial({ color: terrain.material.color })
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(terrain.position)
    mesh.rotation.copy(terrain.rotation)
    mesh.userData.isLevelObject = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    sceneRef.current.add(mesh)
  }

  const createStructureObject = (structure: any) => {
    if (!sceneRef.current) return

    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    switch (structure.type) {
      case 'building':
      case 'tower':
        geometry = new THREE.BoxGeometry(structure.scale.x, structure.scale.y, structure.scale.z)
        break
      case 'bridge':
        geometry = new THREE.BoxGeometry(structure.scale.x, structure.scale.y, structure.scale.z)
        break
      default:
        geometry = new THREE.BoxGeometry(structure.scale.x, structure.scale.y, structure.scale.z)
    }

    material = new THREE.MeshLambertMaterial({ color: structure.material.color })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(structure.position)
    mesh.rotation.copy(structure.rotation)
    mesh.userData.isLevelObject = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    sceneRef.current.add(mesh)
  }

  const createPropObject = (prop: any) => {
    if (!sceneRef.current) return

    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    switch (prop.type) {
      case 'crate':
        geometry = new THREE.BoxGeometry(prop.scale.x, prop.scale.y, prop.scale.z)
        break
      case 'barrel':
        geometry = new THREE.CylinderGeometry(prop.scale.x, prop.scale.x, prop.scale.y, 8)
        break
      case 'vehicle':
        geometry = new THREE.BoxGeometry(prop.scale.x, prop.scale.y, prop.scale.z)
        break
      default:
        geometry = new THREE.BoxGeometry(prop.scale.x, prop.scale.y, prop.scale.z)
    }

    material = new THREE.MeshLambertMaterial({ color: prop.material.color })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(prop.position)
    mesh.rotation.copy(prop.rotation)
    mesh.userData.isLevelObject = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    sceneRef.current.add(mesh)
  }

  const createTile = (tile: any) => {
    if (!sceneRef.current) return

    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    switch (tile.type) {
      case 'floor':
        geometry = new THREE.BoxGeometry(tile.size.x, 0.1, tile.size.z)
        material = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
        break
      case 'wall':
        geometry = new THREE.BoxGeometry(tile.size.x, tile.size.y, tile.size.z)
        material = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        break
      case 'cover':
        geometry = new THREE.BoxGeometry(tile.size.x, tile.size.y, tile.size.z)
        material = new THREE.MeshLambertMaterial({ color: 0x696969 })
        break
      default:
        geometry = new THREE.BoxGeometry(tile.size.x, tile.size.y, tile.size.z)
        material = new THREE.MeshLambertMaterial({ color: 0x808080 })
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(tile.position)
    mesh.rotation.copy(tile.rotation)
    mesh.userData.isLevelObject = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    sceneRef.current.add(mesh)
  }

  const spawnIntelligentEnemies = (level: any) => {
    if (!sceneRef.current || !cameraRef.current) return

    intelligentEnemiesRef.current = []
    
    if (level.spawnPoints && level.spawnPoints.length > 0) {
      level.spawnPoints.forEach((spawnPoint: any) => {
        if (spawnPoint.team === 'enemy') {
          try {
            const difficulty = spawnPoint.type === 'boss' ? 'hard' : 'medium'
            const enemy = new IntelligentEnemy(
              sceneRef.current!,
              spawnPoint.position,
              cameraRef.current!,
              difficulty
            )
            intelligentEnemiesRef.current.push(enemy)
            console.log(`Spawned enemy at position:`, spawnPoint.position)
          } catch (error) {
            console.warn('Failed to spawn intelligent enemy:', error)
            // Create simple fallback enemy
            createSimpleEnemy(spawnPoint.position)
          }
        }
      })
    }

    // Ensure we have at least some enemies
    if (intelligentEnemiesRef.current.length === 0) {
      console.log('No enemies spawned, creating fallback enemies')
      createSimpleEnemy(new THREE.Vector3(10, 1.8, 10))
      createSimpleEnemy(new THREE.Vector3(-10, 1.8, -10))
    }
    
    console.log(`Spawned ${intelligentEnemiesRef.current.length} intelligent enemies`)
    
    // Update enemy count in legacy system
    if (enemyManagerRef.current) {
      enemyManagerRef.current.getEnemyCount = () => 
        intelligentEnemiesRef.current.filter(enemy => {
          try {
            return enemy.getState?.().health > 0
          } catch {
            return false
          }
        }).length
    }
  }

  const createSimpleEnemy = (position: THREE.Vector3) => {
    if (!sceneRef.current) return

    try {
      const enemy = new IntelligentEnemy(
        sceneRef.current!,
        position,
        cameraRef.current!,
        'medium'
      )
      intelligentEnemiesRef.current.push(enemy)
    } catch (error) {
      console.error('Failed to create simple enemy:', error)
    }
  }

  const createSwordSwingEffect = (position: THREE.Vector3, direction: THREE.Vector3) => {
    if (!sceneRef.current) return

    try {
      // Create sword swing arc effect
      const swingGeometry = new THREE.RingGeometry(0.5, 2, 8, 1, 0, Math.PI)
      const swingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      const swingMesh = new THREE.Mesh(swingGeometry, swingMaterial)
      
      // Position the swing arc in front of player
      swingMesh.position.copy(position)
      swingMesh.position.add(direction.clone().multiplyScalar(1))
      
      // Orient the swing arc
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(direction, up).normalize()
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
      swingMesh.quaternion.copy(quaternion)
      
      sceneRef.current.add(swingMesh)
      
      // Animate the swing
      let swingProgress = 0
      const swingDuration = 300 // 300ms swing duration
      const startTime = Date.now()
      
      const animateSwing = () => {
        const elapsed = Date.now() - startTime
        swingProgress = Math.min(elapsed / swingDuration, 1)
        
        // Scale and fade out the swing
        swingMesh.scale.setScalar(1 + swingProgress * 0.5)
        swingMesh.material.opacity = 0.6 * (1 - swingProgress)
        
        // Rotate the swing
        swingMesh.rotation.z = swingProgress * Math.PI * 0.5
        
        if (swingProgress < 1) {
          requestAnimationFrame(animateSwing)
        } else {
          sceneRef.current?.remove(swingMesh)
        }
      }
      
      animateSwing()
      
      // Create sword trail effect
      const trailGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6)
      const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      })
      const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial)
      
      trailMesh.position.copy(position)
      trailMesh.position.add(direction.clone().multiplyScalar(0.75))
      trailMesh.quaternion.copy(quaternion)
      trailMesh.rotateX(Math.PI / 2)
      
      sceneRef.current.add(trailMesh)
      
      // Remove trail after short delay
      setTimeout(() => {
        sceneRef.current?.remove(trailMesh)
      }, 200)
      
      console.log('Sword swing effect created')
    } catch (error) {
      console.warn('Failed to create sword swing effect:', error)
    }
  }

  const showDamageText = (position: THREE.Vector3, damage: number, isCritical: boolean = false) => {
    if (!sceneRef.current) return

    try {
      // Create damage text using canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = 256
      canvas.height = 64
      
      // Set text style
      context.font = 'bold 32px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      
      // Create text with color based on damage
      const color = isCritical ? '#ff0000' : '#ffff00'
      context.fillStyle = color
      context.strokeStyle = '#000000'
      context.lineWidth = 3
      
      // Draw text
      const damageText = Math.round(damage).toString()
      context.strokeText(damageText, 128, 32)
      context.fillText(damageText, 128, 32)
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      })
      const sprite = new THREE.Sprite(material)
      
      // Position sprite at enemy position
      sprite.position.copy(position)
      sprite.position.y += 2 // Offset above enemy
      
      // Scale sprite
      sprite.scale.set(2, 0.5, 1)
      
      sceneRef.current.add(sprite)
      
      // Animate damage text floating up and fading out
      let floatProgress = 0
      const floatDuration = 1500 // 1.5 seconds
      const startTime = Date.now()
      const startPosition = position.clone()
      const endPosition = position.clone()
      endPosition.y += 3 // Float up 3 units
      
      const animateDamageText = () => {
        const elapsed = Date.now() - startTime
        floatProgress = Math.min(elapsed / floatDuration, 1)
        
        // Interpolate position
        sprite.position.lerpVectors(startPosition, endPosition, floatProgress)
        
        // Fade out
        sprite.material.opacity = 1 - floatProgress
        
        // Scale up slightly
        const scale = 1 + floatProgress * 0.5
        sprite.scale.set(2 * scale, 0.5 * scale, 1)
        
        if (floatProgress < 1) {
          requestAnimationFrame(animateDamageText)
        } else {
          sceneRef.current?.remove(sprite)
          texture.dispose()
          material.dispose()
        }
      }
      
      animateDamageText()
      
      console.log(`Damage text shown: ${damage} at position`, position)
    } catch (error) {
      console.warn('Failed to show damage text:', error)
    }
  }

  const addKillLog = (message: string) => {
    const newKillLog = {
      id: `kill_${Date.now()}_${Math.random()}`,
      message: message,
      timestamp: Date.now()
    }
    
    setKillLogs(prev => {
      const updatedLogs = [newKillLog, ...prev].slice(0, 10) // Keep only last 10 logs
      return updatedLogs
    })
    
    console.log('Kill log added:', message)
  }

  const startGame = (gameMode: string = 'survival') => {
    console.log('startGame called with mode:', gameMode)
    
    try {
      // Don't require gameModeManagerRef.current for basic game functionality
      // This allows the game to start even if some systems are not fully initialized
      
      setCurrentGameMode(gameMode)
      setGameActive(true)
      setPlayerHealth(100)
      setPlayerScore(0)
      setPlayerKills(0)
      setPlayerDeaths(0)
      setShowGameMenu(false)
      
      // Reset input states
      setMovement({ forward: false, backward: false, left: false, right: false })
      setMouseMovement({ x: 0, y: 0 })
      playerRotationRef.current = { x: 0, y: 0 }
      
      console.log('Game state updated:', {
        gameActive: true,
        gameMode,
        showGameMenu: false
      })

      // Initialize intelligent systems
      if (adaptiveDifficultySystemRef.current) {
        adaptiveDifficultySystemRef.current.updatePerformance({
          recentKills: [0],
          recentDeaths: [0],
          hitAccuracy: [0.5],
          reactionTimes: [500],
          survivalTimes: [300],
          objectiveCompletionTimes: [],
          weaponUsage: new Map(),
          tacticalDecisions: [1]
        })
      }

      if (gameMode === 'survival') {
        startSurvivalMode()
      } else {
        // Start other game modes with intelligent systems
        if (dynamicGameplaySystemRef.current) {
          const players = ['player1']
          // dynamicGameplaySystemRef.current.startGame(gameMode, players)
        }
      }
      
      // Show success feedback
      console.log(`✅ Game started successfully in ${gameMode} mode`)
    } catch (error) {
      console.error('❌ Failed to start game:', error)
      // Reset game state on error
      setGameActive(false)
      setShowGameMenu(true)
    }
  }

  const checkIntelligentEnemyHits = () => {
    if (!cameraRef.current || !weaponSelectorRef.current) return

    const activeWeapon = weaponSelectorRef.current.getCurrentWeapon()
    if (!activeWeapon) return

    const weaponDef = activeWeapon.getWeapon()
    const range = weaponDef.range || 100

    // Simple raycast for enemy hits
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(cameraRef.current.quaternion)

    const raycaster = new THREE.Raycaster(cameraRef.current.position, direction)
    const intersects = raycaster.intersectObjects(sceneRef.current?.children || [])

    for (const intersect of intersects) {
      // Check if hit object is an enemy
      const enemy = intelligentEnemiesRef.current.find(enemy => 
        enemy.mesh === intersect.object || enemy.healthBar === intersect.object
      )

      if (enemy) {
        const distance = intersect.distance
        if (distance <= range) {
          // Calculate damage based on distance and weapon
          const damage = Math.max(1, weaponDef.damage * (1 - distance / range))
          
          // Apply damage to enemy
          const died = enemy.takeDamage(damage)
          
          // Show damage text
          showDamageText(enemy.mesh.position, damage, damage > 40)
          
          if (died) {
            setPlayerKills(prev => prev + 1)
            setPlayerScore(prev => prev + 100)
            addKillLog(`Du hast einen Feind eliminiert (+${Math.round(damage)} Schaden)`)
            console.log('Enemy killed!')
          }

          // Create hit effect
          if (effectsManagerRef.current) {
            try {
              if (typeof effectsManagerRef.current.createImpactEffect === 'function') {
                effectsManagerRef.current.createImpactEffect(intersect.point, intersect.face?.normal || new THREE.Vector3(0, 1, 0), 'default')
              } else {
                console.log('Impact effect method not available, creating simple effect')
                // Create simple impact effect
                const impactGeometry = new THREE.SphereGeometry(0.1, 8, 8)
                const impactMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
                const impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
                impactMesh.position.copy(intersect.point)
                sceneRef.current?.add(impactMesh)
                
                // Remove impact effect after delay
                setTimeout(() => {
                  sceneRef.current?.remove(impactMesh)
                }, 200)
              }
            } catch (error) {
              console.warn('Failed to create impact effect:', error)
            }
          }

          return true // Hit registered
        }
      }
    }

    return false // No hit
  }

  const startSurvivalMode = () => {
    console.log('startSurvivalMode called')
    console.log('intelligentEnemiesRef.current:', intelligentEnemiesRef.current)
    
    if (intelligentEnemiesRef.current.length === 0) {
      console.warn('No intelligent enemies found, skipping survival mode setup')
      return
    }

    setWaveActive(true)
    setCurrentWave(1)
    
    // Activate intelligent enemies
    intelligentEnemiesRef.current.forEach(enemy => {
      // Start enemy AI behavior
      console.log('Activating intelligent enemy AI')
    })
    
    console.log('Survival mode started with intelligent enemies')
  }

  const nextWave = () => {
    if (intelligentEnemiesRef.current.length === 0) return

    const nextWaveNumber = currentWave + 1
    if (nextWaveNumber <= 5) { // Max 5 waves for now
      setCurrentWave(nextWaveNumber)
      
      // Increase difficulty and spawn more intelligent enemies
      setAiDifficulty(prev => Math.min(3.0, prev + 0.2))
      
      // Spawn additional intelligent enemies
      if (simpleLevelGeneratorRef.current && sceneRef.current && cameraRef.current) {
        const level = simpleLevelGeneratorRef.current.generateLevel(
          aiDifficulty,
          playerSkillLevel,
          'balanced',
          600
        )
        
        // Add new enemies to existing ones
        level.spawnPoints.forEach((spawnPoint: any) => {
          if (spawnPoint.team === 'enemy') {
            const difficulty = spawnPoint.type === 'boss' ? 'hard' : 'medium'
            const enemy = new IntelligentEnemy(
              sceneRef.current!,
              spawnPoint.position,
              cameraRef.current!,
              difficulty
            )
            intelligentEnemiesRef.current.push(enemy)
          }
        })
      }
      
      console.log(`Wave ${nextWaveNumber} started with ${intelligentEnemiesRef.current.length} intelligent enemies`)
    } else {
      // All waves completed - show round end modal
      setWaveActive(false)
      setGameActive(false)
      setRoundEndResult('victory')
      setRoundEndStats({
        playerScore: playerScore,
        enemyScore: Math.floor(playerScore * 0.7), // Enemy score based on player performance
        kills: playerKills,
        deaths: playerDeaths
      })
      setShowRoundEndModal(true)
      console.log('All waves completed! Victory!')
    }
  }

  const handleNextRound = () => {
    setShowRoundEndModal(false)
    // Reset for next round
    setPlayerHealth(100)
    setPlayerKills(0)
    setPlayerDeaths(0)
    setCurrentWave(1)
    setAiDifficulty(1.0)
    
    // Restart game
    startGame('survival')
  }

  const handleBackToMenu = () => {
    setShowRoundEndModal(false)
    setShowGameMenu(true)
  }

  const loadWeaponDefinitions = async () => {
    try {
      // Use fetch to load JSON files instead of dynamic imports
      const weaponFiles = [
        '/data/weapons/ar_mk18.json',
        '/data/weapons/pistol_default.json',
        '/data/weapons/sniper_blackhole.json',
        '/data/weapons/shotgun_quantum.json',
        '/data/weapons/smg_neonblast.json',
        '/data/weapons/sword_energy.json'
      ]
      
      const weapons = []
      
      for (const file of weaponFiles) {
        try {
          const response = await fetch(file)
          if (response.ok) {
            const weapon = await response.json()
            if (weapon && weapon.id) {
              weapons.push(weapon)
            }
          }
        } catch (error) {
          // Silently fail for missing weapon files
        }
      }
      
      if (weapons.length === 0) {
        // Use fallback weapon
        weapons.push({
          id: 'default_rifle',
          name: 'Default Rifle',
          type: 'rifle',
          ammoType: 'default_ammo',
          damage: 25,
          fireRate: 10,
          magazineSize: 30,
          reloadTime: 2.0,
          recoil: {
            horizontal: 0.3,
            vertical: 0.6,
            recovery: 0.5
          },
          spread: {
            min: 0.02,
            max: 0.12,
            increase: 0.01,
            decrease: 0.02
          },
          range: 600,
          penetration: 0.5,
          firstPersonModel: {
            scale: [1, 1, 1],
            position: [0.3, -0.4, -0.8],
            rotation: [0, 0, 0]
          },
          animations: {
            fire: 'fire',
            reload: 'reload',
            idle: 'idle',
            draw: 'draw',
            holster: 'holster'
          },
          sounds: {
            fire: '/sounds/weapons/default_fire.wav',
            reload: '/sounds/weapons/default_reload.wav',
            empty: '/sounds/weapons/default_empty.wav'
          }
        })
      }
      
      weaponDefs.current = weapons
    } catch (error) {
      // Fallback: create a simple default weapon
      weaponDefs.current = [{
        id: 'default_rifle',
        name: 'Default Rifle',
        type: 'rifle',
        ammoType: 'default_ammo',
        damage: 25,
        fireRate: 10,
        magazineSize: 30,
        reloadTime: 2.0,
        recoil: {
          horizontal: 0.3,
          vertical: 0.6,
          recovery: 0.5
        },
        spread: {
          min: 0.02,
          max: 0.12,
          increase: 0.01,
          decrease: 0.02
        },
        range: 600,
        penetration: 0.5,
        firstPersonModel: {
          scale: [1, 1, 1],
          position: [0.3, -0.4, -0.8],
          rotation: [0, 0, 0]
        },
        animations: {
          fire: 'fire',
          reload: 'reload',
          idle: 'idle',
          draw: 'draw',
          holster: 'holster'
        },
        sounds: {
          fire: '/sounds/weapons/default_fire.wav',
          reload: '/sounds/weapons/default_reload.wav',
          empty: '/sounds/weapons/default_empty.wav'
        }
      }]
    }
  }
  
  const setupScene = () => {
    if (!canvasRef.current || !containerRef.current) {
      console.error('Canvas or container not found')
      return
    }
    
    console.log('Setting up scene...')
    
    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue
    sceneRef.current = scene
    
    // Create camera with proper quaternion initialization
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.8, 0) // Eye level
    
    // Initialize camera rotation with proper quaternion
    const initialQuaternion = new THREE.Quaternion()
    initialQuaternion.setFromEuler(new THREE.Euler(0, 0, 0, 'YXZ'))
    camera.quaternion.copy(initialQuaternion)
    
    cameraRef.current = camera
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    
    console.log('Renderer created:', {
      canvas: !!canvasRef.current,
      renderer: !!rendererRef.current,
      scene: !!sceneRef.current,
      camera: !!cameraRef.current
    })
    
    // Level manager will handle lighting and environment
    // Just add basic lighting for now
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    
    // Add simple ground (will be replaced by level manager)
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    
    // Add some simple objects for testing
    addSimpleObjects(scene)
    
    console.log('Scene setup complete')
  }
  
  const addSimpleObjects = (scene: THREE.Scene) => {
    console.log('Adding simple objects to scene...')
    
    // Add some cubes for visual reference
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    
    for (let i = 0; i < 10; i++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.position.set(
        (Math.random() - 0.5) * 20,
        0.5,
        (Math.random() - 0.5) * 20
      )
      cube.castShadow = true
      scene.add(cube)
    }
    
    console.log('Added 10 cubes to scene')
  }
  
  const setupWeapons = () => {
    if (!cameraRef.current || !sceneRef.current) return
    
    // Create weapon selector
    weaponSelectorRef.current = new WeaponSelector(
      cameraRef.current,
      sceneRef.current
    )
    
    // Equip weapons
    if (weaponDefs.current.length >= 2) {
      weaponSelectorRef.current.equipWeapon('primary', weaponDefs.current[0]) // AR
      weaponSelectorRef.current.equipWeapon('secondary', weaponDefs.current[1]) // Pistol
      weaponSelectorRef.current.switchToSlot('primary')
    }
  }
  
  const setupEffects = () => {
    if (!sceneRef.current) return
    
    // Create effects manager
    effectsManagerRef.current = new EffectsManager(sceneRef.current)
  }
  
  const setupShooting = () => {
    if (!cameraRef.current || !sceneRef.current || !effectsManagerRef.current) return
    
    // Create shooting system
    shootingSystemRef.current = new ShootingSystem(
      sceneRef.current,
      cameraRef.current,
      effectsManagerRef.current
    )
  }
  
  const setupPerformanceMonitor = () => {
    // Create performance monitor with callbacks
    performanceMonitorRef.current = new PerformanceMonitor({
      onPerformanceWarning: (metrics: any) => {
        console.warn('Performance warning:', metrics)
      },
      onPerformanceCritical: (metrics: any) => {
        console.error('Performance critical:', metrics)
      },
      onPerformanceRecovery: (metrics: any) => {
        console.log('Performance recovered:', metrics)
      }
    })
  }
  
  const setupInputHandlers = () => {
    // Einfache Bewegungs-Handler
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key.toLowerCase()) {
        case 'w':
          setMovement(prev => ({ ...prev, forward: true }))
          break
        case 's':
          setMovement(prev => ({ ...prev, backward: true }))
          break
        case 'a':
          setMovement(prev => ({ ...prev, left: true }))
          break
        case 'd':
          setMovement(prev => ({ ...prev, right: true }))
          break
        case 'shift':
          setIsSprinting(true)
          break
        case 'control':
          setIsCrouching(true)
          setPlayerHeight(0.9)
          break
        case 'r':
          if (weaponSelectorRef.current) {
            weaponSelectorRef.current.handleKeyDown(event)
          }
          break
        case 'escape':
          if (isPointerLocked) {
            document.exitPointerLock()
          } else {
            setShowGameMenu(prev => !prev)
          }
          break
        case 'tab':
          event.preventDefault() // Prevent default tab behavior
          setShowScoreboard(true)
          break
        case 'f3':
          setShowPerformanceMonitor(prev => !prev)
          break
        case 'enter':
          if (!gameActive) {
            startGame(currentGameMode)
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
          if (weaponSelectorRef.current) {
            const slotMap: { [key: string]: 'primary' | 'secondary' | 'melee' | 'equipment' } = {
              '1': 'primary',
              '2': 'secondary',
              '3': 'melee',
              '4': 'equipment'
            }
            const slot = slotMap[event.key as keyof typeof slotMap]
            if (slot) {
              weaponSelectorRef.current.switchToSlot(slot)
            }
          }
          break
      }
      
      // Verhindere Standardverhalten für Spieltasten
      if (['w', 'a', 's', 'd', ' ', 'shift', 'control', 'r'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      switch(event.key.toLowerCase()) {
        case 'w':
          setMovement(prev => ({ ...prev, forward: false }))
          break
        case 's':
          setMovement(prev => ({ ...prev, backward: false }))
          break
        case 'a':
          setMovement(prev => ({ ...prev, left: false }))
          break
        case 'd':
          setMovement(prev => ({ ...prev, right: false }))
          break
        case 'shift':
          setIsSprinting(false)
          break
        case 'control':
          setIsCrouching(false)
          setPlayerHeight(1.8)
          break
        case 'tab':
          setShowScoreboard(false)
          break
      }
      
      // Verhindere Standardverhalten für Spieltasten
      if (['w', 'a', 's', 'd', ' ', 'shift', 'control', 'r', 'tab'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }
    }
    
    const handleMouseDown = (event: MouseEvent) => {
      // Handle right click for ADS (Aim Down Sights)
      if (event.button === 2) { // Right mouse button
        event.preventDefault() // Prevent context menu
        if (gameActive && isPointerLocked) {
          // Start aiming
          console.log('Starting ADS...')
          setIsAiming(true)
        }
      } else if (event.button === 0) { // Left mouse button
        setMouseDown(true)
        
        // Request pointer lock on first click
        if (!isPointerLocked && canvasRef.current && gameActive) {
          canvasRef.current.requestPointerLock()
        }
      }
    }
    
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) { // Right mouse button
        event.preventDefault() // Prevent context menu
        if (gameActive && isPointerLocked) {
          // Stop aiming
          console.log('Stopping ADS...')
          setIsAiming(false)
        }
      } else if (event.button === 0) { // Left mouse button
        setMouseDown(false)
      }
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isPointerLocked) {
        const movementX = event.movementX || 0
        const movementY = event.movementY || 0
        setMouseMovement({
          x: movementX,
          y: movementY
        })
      }
    }
    
    const preventContextMenu = (event: Event) => {
      event.preventDefault()
    }
    
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === canvasRef.current
      console.log('Pointer lock changed:', locked)
      setIsPointerLocked(locked)
    }
    
    const handleClick = () => {
      // Request pointer lock when clicking on the game canvas
      if (canvasRef.current && !isPointerLocked && gameActive) {
        console.log('Requesting pointer lock...')
        try {
          canvasRef.current.requestPointerLock()
        } catch (error) {
          console.error('Failed to request pointer lock:', error)
        }
      }
    }
    
    // Add event listeners
    // Direkte Event-Listener für maximale Kompatibilität
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('contextmenu', preventContextMenu)
    
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleClick)
    }
    
    if (containerRef.current) {
      containerRef.current.addEventListener('focus', () => {
        // Container focused
      })
      containerRef.current.addEventListener('blur', () => {
        // Container blurred
      })
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('contextmenu', preventContextMenu)
      
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick)
      }
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('focus', () => {
          // Container focused
        })
        containerRef.current.removeEventListener('blur', () => {
          // Container blurred
        })
      }
    }
  }
  
  const startGameLoop = () => {
    let lastTime = 0
    let frameCount = 0
    let fpsTime = 0
    let lastDebugTime = 0
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 100) // Cap deltaTime to prevent large jumps
      lastTime = currentTime
      
      // Calculate FPS
      frameCount++
      fpsTime += deltaTime
      if (fpsTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / fpsTime)
        if (frameCount % 60 === 0) { // Log FPS every 60 frames
          console.log(`FPS: ${fps}`)
        }
        frameCount = 0
        fpsTime = 0
      }
      
      // Debug: Log game loop every 5 seconds
      if (currentTime - lastDebugTime > 5000) {
        console.log('Game loop running:', {
          currentTime,
          deltaTime,
          gameActive,
          isPointerLocked,
          movement,
          cameraPosition: cameraRef.current?.position.toArray()
        })
        lastDebugTime = currentTime
      }
      
      // Start performance monitoring
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.startFrame()
      }
      
      // Only update and render if game is active or in menu
      if (gameActive || showGameMenu) {
        update(deltaTime)
        render()
      }
      
      // End performance monitoring
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.endFrame()
      }
      
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationRef.current = requestAnimationFrame(gameLoop)
  }
  
  const update = (deltaTime: number) => {
    // Start update timing
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.startUpdate()
    }
    
    // Update intelligent gameplay systems
    if (dynamicGameplaySystemRef.current && gameActive) {
      const gameState = {
        time: Date.now(),
        playerHealth,
        playerPosition: cameraRef.current?.position || new THREE.Vector3(0, 0, 0),
        enemyCount: intelligentEnemiesRef.current.length,
        score: playerScore,
        currentWave,
        lastEnemyKill: false
      }
      dynamicGameplaySystemRef.current.update(deltaTime, gameState)
    }
    
    // Update intelligent enemies
    if (intelligentEnemiesRef.current.length > 0 && cameraRef.current && gameActive) {
      intelligentEnemiesRef.current.forEach(enemy => {
        enemy.update(deltaTime, cameraRef.current!.position)
      })
      
      // Check if all enemies are defeated
      const aliveEnemies = intelligentEnemiesRef.current.filter(enemy => 
        enemy.getState().health > 0
      )
      
      if (aliveEnemies.length === 0 && waveActive) {
        setWaveActive(false)
        setTimeout(() => {
          nextWave()
        }, 2000)
      }
    }
    
    // Update weapon selector with intelligent weapon system
    if (weaponSelectorRef.current) {
      weaponSelectorRef.current.update(deltaTime)
      
      // Handle firing with intelligent effects
      if (mouseDown && isPointerLocked && gameActive) {
        const success = weaponSelectorRef.current.fire(Date.now())
        if (success && shootingSystemRef.current && cameraRef.current && effectsManagerRef.current) {
          // Get shooting direction and parameters
          const direction = new THREE.Vector3(0, 0, -1)
          direction.applyQuaternion(cameraRef.current.quaternion)
          
          const activeWeapon = weaponSelectorRef.current.getCurrentWeapon()
          let spread = activeWeapon ? activeWeapon.getSpread() : 0
          
          // Apply ADS accuracy bonus
          if (isAiming) {
            spread *= 0.4 // Reduce spread by 60% when aiming
          }
          
          const recoil = activeWeapon ? activeWeapon.getRecoil() : { horizontal: 0, vertical: 0 }
          
          // Create muzzle flash effect
          const muzzlePosition = cameraRef.current.position.clone()
          const muzzleOffset = new THREE.Vector3(0.3, -0.2, -0.8)
          muzzleOffset.applyQuaternion(cameraRef.current.quaternion)
          muzzlePosition.add(muzzleOffset)
          
          if (effectsManagerRef.current) {
            try {
              // Get weapon definition to check if this is a melee weapon
              const weaponDef = activeWeapon ? activeWeapon.getWeapon() as ExtendedWeaponDef : null
              // Check if this is a melee weapon (sword)
              if (weaponDef && weaponDef.category === 'Melee') {
                createSwordSwingEffect(muzzlePosition, direction)
              } else {
                if (typeof effectsManagerRef.current.createMuzzleFlash === 'function') {
                  effectsManagerRef.current.createMuzzleFlash(muzzlePosition, direction)
                } else {
                  console.log('Muzzle flash method not available, creating simple effect')
                  // Create simple muzzle flash
                  const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8)
                  const flashMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.8
                  })
                  const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial)
                  flashMesh.position.copy(muzzlePosition)
                  sceneRef.current?.add(flashMesh)
                  
                  // Remove flash after short delay
                  setTimeout(() => {
                    sceneRef.current?.remove(flashMesh)
                  }, 50)
                }
              }
            } catch (error) {
              console.warn('Failed to create muzzle flash:', error)
            }
          }
          
          // Create shooting effects
          shootingSystemRef.current.shoot(direction, spread, recoil)
          
          // Check for intelligent enemy hits
          checkIntelligentEnemyHits()
          
          // Update player performance for adaptive difficulty
          if (adaptiveDifficultySystemRef.current) {
            adaptiveDifficultySystemRef.current.updatePerformance({
              recentKills: [1],
              recentDeaths: [],
              hitAccuracy: [0.8],
              reactionTimes: [200],
              survivalTimes: [deltaTime],
              objectiveCompletionTimes: [],
              weaponUsage: new Map([['current_weapon', 1]]),
              tacticalDecisions: [1]
            })
          }
        }
      }
    }
    
    // Update effects
    if (effectsManagerRef.current) {
      effectsManagerRef.current.update(deltaTime)
    }
    
    // Update shooting system
    if (shootingSystemRef.current) {
      shootingSystemRef.current.update(deltaTime)
    }
    
    // Handle player movement
    handleMovement(deltaTime)
    
    // Handle mouse look
    handleMouseLook(deltaTime)
    
    // Reset mouse movement after processing
    setMouseMovement({ x: 0, y: 0 })
    
    // Update adaptive difficulty
    if (adaptiveDifficultySystemRef.current && gameActive) {
      const difficultySettings = adaptiveDifficultySystemRef.current.getCurrentDifficultySettings()
      setAiDifficulty(difficultySettings.enemyHealth)
    }
    
    // End update timing
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.endUpdate()
    }
  }

  const checkEnemyHits = () => {
    if (!cameraRef.current || !enemyManagerRef.current || !shootingSystemRef.current) return

    // Simple raycast for enemy hits
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current)

    // Check for enemy hits (simplified - in real implementation would use proper collision)
    const hit = enemyManagerRef.current.damageEnemyAtPosition(
      cameraRef.current.position.clone().add(
        cameraRef.current.getWorldDirection(new THREE.Vector3()).multiplyScalar(50)
      ),
      25, // damage
      2.0  // radius
    )

    if (hit && statsManagerRef.current) {
      // Update player stats
      statsManagerRef.current.onPlayerKill('player1', 'enemy1', 'current_weapon')
      setPlayerKills(prev => prev + 1)
      setPlayerScore(prev => prev + 100)
    }
  }
  
  const handleMovement = (deltaTime: number) => {
    if (!cameraRef.current) return
    
    // Bewegungsgeschwindigkeit
    let speed = 0.05
    if (isSprinting && !isCrouching) {
      speed = 0.08
    } else if (isCrouching) {
      speed = 0.025
    }
    
    const camera = cameraRef.current
    
    // Höhe anpassen
    const targetHeight = isCrouching ? 0.9 : 1.8
    camera.position.y += (targetHeight - camera.position.y) * 0.1
    
    // Bewegungsrichtung basierend auf Kamera-Rotation
    const forward = new THREE.Vector3(0, 0, -1)
    const right = new THREE.Vector3(1, 0, 0)
    
    forward.applyQuaternion(camera.quaternion)
    right.applyQuaternion(camera.quaternion)
    
    // Auf horizontale Ebene beschränken
    forward.y = 0
    right.y = 0
    forward.normalize()
    right.normalize()
    
    // Bewegung berechnen
    const moveVector = new THREE.Vector3()
    
    if (movement.forward) {
      moveVector.add(forward)
    }
    if (movement.backward) {
      moveVector.sub(forward)
    }
    if (movement.left) {
      moveVector.sub(right)
    }
    if (movement.right) {
      moveVector.add(right)
    }
    
    // Bewegung anwenden
    if (moveVector.length() > 0) {
      moveVector.normalize()
      moveVector.multiplyScalar(speed)
      camera.position.add(moveVector)
    }
  }
  
  const handleMouseLook = (deltaTime: number) => {
    if (!cameraRef.current || !isPointerLocked) return
    
    const camera = cameraRef.current
    const sensitivity = gameSettings.gameplay.mouseSensitivity
    const invertY = gameSettings.gameplay.invertMouseY ? -1 : 1
    
    // Only update if there's actual mouse movement
    if (mouseMovement.x !== 0 || mouseMovement.y !== 0) {
      // Update player rotation
      playerRotationRef.current.y -= mouseMovement.x * sensitivity
      playerRotationRef.current.x -= mouseMovement.y * sensitivity * invertY
      
      // Clamp vertical rotation to prevent over-rotation
      playerRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, playerRotationRef.current.x))
      
      // Apply rotation to camera using quaternion to avoid Euler order issues
      const quaternion = new THREE.Quaternion()
      quaternion.setFromEuler(new THREE.Euler(
        playerRotationRef.current.x,
        playerRotationRef.current.y,
        0,
        'YXZ'
      ))
      camera.quaternion.copy(quaternion)
    }
  }
  
  const render = () => {
    // Start render timing
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.startRender()
    }
    
    // Only render if we have all necessary components
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
    
    // End render timing
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.endRender()
    }
  }
  
  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    if (weaponSelectorRef.current) {
      weaponSelectorRef.current.dispose()
    }
    
    if (effectsManagerRef.current) {
      effectsManagerRef.current.dispose()
    }
    
    if (shootingSystemRef.current) {
      shootingSystemRef.current.dispose()
    }
    
    if (enemyManagerRef.current) {
      enemyManagerRef.current.dispose()
    }
    
    if (gameModeManagerRef.current) {
      gameModeManagerRef.current.endCurrentGame()
    }
    
    if (statsManagerRef.current) {
      statsManagerRef.current.dispose()
    }
    
    if (levelManagerRef.current) {
      levelManagerRef.current.dispose()
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose()
    }
  }
  
  // Get current weapon state for UI
  const getCurrentWeaponState = () => {
    if (!weaponSelectorRef.current) return null
    
    const activeWeapon = weaponSelectorRef.current.getCurrentWeapon()
    if (!activeWeapon) return null
    
    return {
      weaponDef: activeWeapon.getWeapon(),
      weaponState: activeWeapon.getState(),
      slotName: weaponSelectorRef.current.getCurrentSlot(),
      ammo: activeWeapon.getAmmoStatus()
    }
  }
  
  const getWeaponSlots = () => {
    if (!weaponSelectorRef.current) return []
    return weaponSelectorRef.current.getAllSlots()
  }
  
  const getActiveSlotId = () => {
    if (!weaponSelectorRef.current) return null
    return weaponSelectorRef.current.activeSlotId
  }
  
  const getCrosshairSpread = () => {
    if (!weaponSelectorRef.current) return 0
    
    const activeWeapon = weaponSelectorRef.current.getCurrentWeapon()
    if (!activeWeapon) return 0
    
    const weaponDef = activeWeapon.getWeapon()
    const weaponState = activeWeapon.getState()
    
    // Calculate spread based on weapon state
    const baseSpread = weaponDef.spread.min
    const maxSpread = weaponDef.spread.max
    const heatMultiplier = weaponState.heat
    
    let spread = baseSpread + (maxSpread - baseSpread) * heatMultiplier
    
    // Apply ADS accuracy bonus
    if (isAiming) {
      spread *= 0.4 // Reduce spread by 60% when aiming
    }
    
    return spread
  }
  
  const handleSettingsChange = (newSettings: GameSettings) => {
    setGameSettings(newSettings)
    
    // Apply graphics settings
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = newSettings.graphics.shadows
    }
    
    // Store settings in localStorage for persistence
    try {
      localStorage.setItem('shootingstar-settings', JSON.stringify(newSettings))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }
  
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('shootingstar-settings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setGameSettings(parsedSettings)
        handleSettingsChange(parsedSettings)
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
  }
  
  const weaponInfo = getCurrentWeaponState()
  const weaponSlots = getWeaponSlots()
  const activeSlotId = getActiveSlotId()
  const crosshairSpread = getCrosshairSpread()
  
  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-screen game-container ${className || ''}`}
      style={{ cursor: showGameMenu || !gameActive ? 'default' : 'none' }}
      tabIndex={0} // Make container focusable
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ 
          cursor: isPointerLocked ? 'none' : 'crosshair',
          pointerEvents: gameActive ? 'auto' : 'none'
        }}
        onClick={() => {
          if (gameActive && !isPointerLocked) {
            console.log('Canvas clicked, requesting pointer lock...')
            try {
              canvasRef.current?.requestPointerLock()
            } catch (error) {
              console.error('Failed to request pointer lock from canvas:', error)
            }
          }
        }}
      />
      
      {/* Game Menu - shown when not in game or when ESC is pressed */}
      {(!gameActive || showGameMenu) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center text-white p-8 bg-gray-900/90 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold mb-6">SHOOTINGSTAR FPS</h2>
            
            {!gameActive ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Spielmodus wählen</h3>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Start button clicked - starting survival mode')
                    startGame('survival')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Überleben
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('FFA button clicked - starting FFA mode')
                    startGame('ffa')
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Jeder gegen Jeden
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('TDM button clicked - starting TDM mode')
                    startGame('tdm')
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Team-Deathmatch
                </button>
                
                <div className="mt-6 text-sm text-gray-300">
                  <p><strong>Level:</strong> {currentLevel?.name || 'Trainingsanlage'}</p>
                  <p><strong>Steuerung:</strong></p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>WASD - Bewegen</div>
                    <div>Maus - Zielen</div>
                    <div>Umschalt - Sprinten</div>
                    <div>Strg - Ducken</div>
                    <div>Klick - Schießen</div>
                    <div>R - Nachladen</div>
                    <div>1-4 - Waffen wechseln</div>
                    <div>F3 - Performance-Monitor</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Spiel pausiert</h3>
                <p>Drücke ESC um fortzufahren</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-semibold">Punkte</div>
                    <div className="text-2xl">{playerScore}</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-semibold">Kills</div>
                    <div className="text-2xl">{playerKills}</div>
                  </div>
                </div>
                
                {currentGameMode === 'survival' && (
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-semibold">Welle {currentWave}</div>
                    <div className="text-sm">
                      {waveActive ? 'Kampf im Gange' : 'Welle abgeschlossen'}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowGameMenu(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Fortsetzen
                </button>
                
                <button
                  onClick={() => {
                    setGameActive(false)
                    setShowGameMenu(false)
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Beenden
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Game Started Success Notification */}
      {gameActive && !showGameMenu && !isPointerLocked && (
        <div 
          className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-6 py-3 rounded-lg font-bold z-40 animate-pulse cursor-pointer"
          onClick={() => {
            console.log('Notification clicked, requesting pointer lock...')
            if (canvasRef.current) {
              try {
                canvasRef.current.requestPointerLock()
              } catch (error) {
                console.error('Failed to request pointer lock from notification:', error)
              }
            }
          }}
        >
          🎮 Spiel gestartet! Klicke um Maussteuerung zu aktivieren
        </div>
      )}
      {!isPointerLocked && gameActive && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={() => {
            console.log('Overlay clicked, requesting pointer lock...')
            if (canvasRef.current) {
              try {
                canvasRef.current.requestPointerLock()
              } catch (error) {
                console.error('Failed to request pointer lock from overlay:', error)
              }
            }
          }}
        >
          <div className="text-center text-white p-8 bg-gray-900/80 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Klicke zum Spielen</h2>
            <p className="mb-4">Klicke um Maussteuerung zu aktivieren</p>
            <div className="space-y-2 text-sm">
              <div><strong>WASD</strong> - Bewegen</div>
              <div><strong>Maus</strong> - Zielen</div>
              <div><strong>Klick</strong> - Schießen</div>
              <div><strong>R</strong> - Nachladen</div>
              <div><strong>1-4</strong> - Waffen wechseln</div>
              <div><strong>Umschalt</strong> - Sprinten</div>
              <div><strong>Strg</strong> - Ducken</div>
              <div><strong>F3</strong> - Performance-Monitor</div>
              <div><strong>ESC</strong> - Menü</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Game HUD - only show when game is active */}
      {gameActive && (
        <>
          {/* Crosshair */}
          <Crosshair
            accuracy={1.0 - crosshairSpread}
            color="white"
            dynamic={true}
            isAiming={isAiming}
            isMoving={movement.forward || movement.backward || movement.left || movement.right}
            size={20}
            thickness={2}
            gap={4}
            dot={true}
            circle={true}
          />
          
          {/* Weapon HUD */}
          {weaponInfo && (
            <WeaponHUD
              weaponDef={weaponInfo.weaponDef}
              weaponState={weaponInfo.weaponState}
              slotName={weaponInfo.slotName}
            />
          )}
          
          {/* Weapon Selector UI */}
          <WeaponSelectorUI
            weapons={weaponSlots}
            activeSlotId={activeSlotId}
          />
          
          {/* Game Stats HUD */}
          <div className="absolute top-4 left-4 p-4 bg-black/70 backdrop-blur-sm rounded text-white">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-xs text-gray-400">Punkte</div>
                  <div className="text-xl font-bold">{playerScore}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Kills</div>
                  <div className="text-xl font-bold">{playerKills}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Tode</div>
                  <div className="text-xl font-bold">{playerDeaths}</div>
                </div>
              </div>
              
              {/* Health Bar */}
              <div className="w-48">
                <div className="flex justify-between text-xs mb-1">
                  <span>Gesundheit</span>
                  <span>{playerHealth}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${playerHealth}%` }}
                  />
                </div>
              </div>
              
              {/* Wave Info for Survival Mode */}
              {currentGameMode === 'survival' && (
                <div className="pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-400">Welle</div>
                  <div className="text-lg font-bold">
                    {currentWave} / 5
                  </div>
                  <div className="text-xs text-gray-400">
                    Gegner: {intelligentEnemiesRef.current.filter(enemy => enemy.getState?.().health > 0).length || 0}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-4 p-4 bg-black/70 backdrop-blur-sm rounded text-white text-sm">
            <div className="space-y-1">
              <div><strong>Bewegung:</strong> WASD</div>
              <div><strong>Sprint:</strong> Shift</div>
              <div><strong>Ducken:</strong> Strg</div>
              <div><strong>Feuer:</strong> Mausklick</div>
              <div><strong>Nachladen:</strong> R</div>
              <div><strong>Waffen:</strong> 1-4</div>
              <div><strong>Menü:</strong> ESC</div>
            </div>
          </div>
          
          {/* Kill Logs */}
          <div className="absolute top-4 right-4 p-4 bg-black/70 backdrop-blur-sm rounded text-white max-w-xs">
            <div className="text-sm font-semibold mb-2 text-yellow-400">Kill Logs</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {killLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="text-xs p-2 bg-gray-800/50 rounded border-l-2 border-yellow-400"
                >
                  {log.message}
                </div>
              ))}
              {killLogs.length === 0 && (
                <div className="text-xs text-gray-400 italic">Noch keine Kills...</div>
              )}
            </div>
          </div>
          
          {/* Scoreboard - shown when Tab is pressed */}
          {showScoreboard && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
              <div className="bg-gray-900/95 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">SPIELSTAND</h2>
                  <div className="text-gray-400">Modus: {currentGameMode === 'survival' ? 'Überleben' : 'Jeder gegen Jeden'}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Player Stats */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="text-white font-semibold">DU (Spieler)</div>
                      </div>
                      <div className="text-green-400 font-bold">LIVE</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-gray-400 text-xs">Punkte</div>
                        <div className="text-white text-lg font-bold">{playerScore}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Kills</div>
                        <div className="text-white text-lg font-bold">{playerKills}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Tode</div>
                        <div className="text-white text-lg font-bold">{playerDeaths}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">K/D</div>
                        <div className="text-white text-lg font-bold">
                          {playerDeaths > 0 ? (playerKills / playerDeaths).toFixed(2) : playerKills}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enemy Stats */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="text-white font-semibold">GEGNER</div>
                      </div>
                      <div className="text-red-400 font-bold">
                        {intelligentEnemiesRef.current.filter(enemy => enemy.getState?.().health > 0).length} LEBEND
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-gray-400 text-xs">Gesamt</div>
                        <div className="text-white text-lg font-bold">{intelligentEnemiesRef.current.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Eliminiert</div>
                        <div className="text-white text-lg font-bold">{playerKills}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Verbleibend</div>
                        <div className="text-white text-lg font-bold">
                          {intelligentEnemiesRef.current.filter(enemy => enemy.getState?.().health > 0).length}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wave Info for Survival Mode */}
                  {currentGameMode === 'survival' && (
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-yellow-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="text-white font-semibold">WELLENINFO</div>
                        </div>
                        <div className="text-yellow-400 font-bold">
                          Welle {currentWave}/5
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-gray-400 text-xs">Status</div>
                          <div className="text-white text-lg font-bold">
                            {waveActive ? 'AKTIV' : 'BEENDET'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Fortschritt</div>
                          <div className="text-white text-lg font-bold">
                            {Math.round((currentWave / 5) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center mt-6">
                  <div className="text-gray-400 text-sm">TAB gedrückt halten, um Scoreboard anzuzeigen</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Performance Monitor */}
      {performanceMonitorRef.current && (
        <PerformanceMonitorComponent
          monitor={performanceMonitorRef.current as any}
          visible={showPerformanceMonitor}
        />
      )}
      
      {/* Settings Menu */}
      <SettingsMenu
        isOpen={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        onSettingsChange={handleSettingsChange}
        initialSettings={gameSettings}
      />
      
      {/* Round End Modal */}
      {showRoundEndModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-white">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">
                Runde beendet!
              </h2>
              <div className={`text-xl font-semibold mb-4 ${
                roundEndResult === 'victory' ? 'text-green-400' : 
                roundEndResult === 'defeat' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {roundEndResult === 'victory' ? 'Sieg' : 
                 roundEndResult === 'defeat' ? 'Niederlage' : 'Unentschieden'}
              </div>
              <div className="text-lg mb-2">
                {roundEndStats.playerScore} - {roundEndStats.enemyScore}
              </div>
            </div>
            
            {/* Statistics */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-center">Statistik</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Kills:</span>
                  <span className="font-bold text-green-400">{roundEndStats.kills}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tode:</span>
                  <span className="font-bold text-red-400">{roundEndStats.deaths}</span>
                </div>
                <div className="flex justify-between">
                  <span>Punktzahl:</span>
                  <span className="font-bold text-blue-400">{roundEndStats.playerScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gegner-Punktzahl:</span>
                  <span className="font-bold text-orange-400">{roundEndStats.enemyScore}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleNextRound}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Weiterspielen
              </button>
              <button
                onClick={handleBackToMenu}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Hauptmenü
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}