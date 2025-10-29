// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  Car,
  Settings,
  Volume2,
  VolumeX,
  Users,
  Bot,
  Zap,
  Timer,
  Trophy,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Gauge,
  Fuel,
  Wind,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target,
  Flag,
  Wrench,
  CircuitBoard,
  Map
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// Re-use existing types from ultimate-racing-3d.tsx
interface CarPhysics {
  position: THREE.Vector3
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  rotation: THREE.Euler
  angularVelocity: THREE.Vector3
  mass: number
  drag: number
  downforce: number
  wheelSpinLoss: number
  wheelTraction: number
  brakeForce: number
  enginePower: number
  transmissionEfficiency: number
  gear: number
  rpm: number
  fuel: number
  temperature: number
  tire: {
    wear: number
    grip: number
    pressure: number
    temperature: number
  }[]
  drift: number // NEW: Drift amount
  nitro: number // NEW: Nitro level
}

interface CarConfiguration {
  id: string
  name: string
  manufacturer: string
  class: 'street' | 'sport' | 'race' | 'formula' | 'drift'
  engine: {
    type: 'v6' | 'v8' | 'v12' | 'turbo' | 'electric'
    power: number // HP
    torque: number // Nm
    redline: number // RPM
  }
  transmission: {
    type: 'manual' | 'automatic' | 'sequential'
    gears: number
    ratio: number[]
  }
  chassis: {
    weight: number // kg
    distribution: number // 0-1 (front to rear)
    wheelbase: number // meters
    trackWidth: number // meters
  }
  aerodynamics: {
    dragCoefficient: number
    downforceCoefficient: number
    frontalArea: number
  }
  suspension: {
    springRate: number
    damping: number
    antiRollBar: number
    rideHeight: number
  }
  tires: {
    compound: 'street' | 'sport' | 'racing' | 'drift'
    width: number // mm
    profile: number // %
    diameter: number // inches
  }
  brakes: {
    type: 'drum' | 'disc' | 'carbon'
    power: number
    balance: number
  }
}

interface Track {
  id: string
  name: string
  description: string
  country: string
  length: number // meters
  turns: number
  elevation: number // meters
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  points: THREE.Vector3[]
  bestTime: number
  weather: 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'night'
  temperature: number // Celsius
  environment: 'city' | 'mountain' | 'desert' | 'forest' | 'coastal'
}

interface AIDriver {
  id: string
  name: string
  skill: number // 0-100
  aggression: number // 0-100
  consistency: number // 0-100
  style: 'aggressive' | 'defensive' | 'tactical' | 'smooth'
  car: CarConfiguration
  physics: CarPhysics
  position: number
  lapTime: number[]
  penalties: number
  targetPointIndex: number
}

interface RaceStats {
  position: number
  totalPositions: number
  lapTime: number
  bestLap: number
  totalTime: number
  lap: number
  totalLaps: number
  speed: number
  distance: number
  fuel: number
  tireWear: number[]
  penalties: number
  points: number
  driftScore: number
  sectorsTime: number[]
  topSpeed: number
  averageSpeed: number
  consistency: number
  nitroLevel: number // NEW: Nitro percentage
  isDrifting: boolean // NEW: Drifting state
}

// Car configurations (same as original)
const carConfigurations: CarConfiguration[] = [
  {
    id: 'formula_1',
    name: 'RB19 Formula',
    manufacturer: 'Red Bull Racing',
    class: 'formula',
    engine: {
      type: 'v6',
      power: 1000,
      torque: 500,
      redline: 15000
    },
    transmission: {
      type: 'sequential',
      gears: 8,
      ratio: [3.5, 2.8, 2.2, 1.8, 1.5, 1.3, 1.1, 1.0]
    },
    chassis: {
      weight: 798,
      distribution: 0.45,
      wheelbase: 3.7,
      trackWidth: 2.0
    },
    aerodynamics: {
      dragCoefficient: 0.7,
      downforceCoefficient: 3.5,
      frontalArea: 1.6
    },
    suspension: {
      springRate: 200,
      damping: 0.8,
      antiRollBar: 100,
      rideHeight: 0.05
    },
    tires: {
      compound: 'racing',
      width: 330,
      profile: 55,
      diameter: 13
    },
    brakes: {
      type: 'carbon',
      power: 2000,
      balance: 0.6
    }
  },
  {
    id: 'supercar',
    name: 'McLaren 720S',
    manufacturer: 'McLaren',
    class: 'sport',
    engine: {
      type: 'v8',
      power: 720,
      torque: 770,
      redline: 8500
    },
    transmission: {
      type: 'automatic',
      gears: 7,
      ratio: [4.2, 2.8, 1.9, 1.4, 1.0, 0.8, 0.6]
    },
    chassis: {
      weight: 1419,
      distribution: 0.42,
      wheelbase: 2.67,
      trackWidth: 1.67
    },
    aerodynamics: {
      dragCoefficient: 0.32,
      downforceCoefficient: 0.8,
      frontalArea: 2.1
    },
    suspension: {
      springRate: 80,
      damping: 0.6,
      antiRollBar: 40,
      rideHeight: 0.12
    },
    tires: {
      compound: 'sport',
      width: 305,
      profile: 35,
      diameter: 20
    },
    brakes: {
      type: 'disc',
      power: 1500,
      balance: 0.65
    }
  },
  {
    id: 'drift_car',
    name: 'Nissan Silvia S15',
    manufacturer: 'Nissan',
    class: 'drift',
    engine: {
      type: 'turbo',
      power: 400,
      torque: 500,
      redline: 8000
    },
    transmission: {
      type: 'manual',
      gears: 6,
      ratio: [3.8, 2.4, 1.6, 1.2, 1.0, 0.8]
    },
    chassis: {
      weight: 1240,
      distribution: 0.55,
      wheelbase: 2.52,
      trackWidth: 1.48
    },
    aerodynamics: {
      dragCoefficient: 0.35,
      downforceCoefficient: 0.4,
      frontalArea: 2.2
    },
    suspension: {
      springRate: 60,
      damping: 0.5,
      antiRollBar: 30,
      rideHeight: 0.15
    },
    tires: {
      compound: 'drift',
      width: 255,
      profile: 40,
      diameter: 18
    },
    brakes: {
      type: 'disc',
      power: 1200,
      balance: 0.7
    }
  }
]

// Generate track points for a simple oval track
const generateTrackPoints = (trackType: 'oval' | 'circuit' = 'circuit'): THREE.Vector3[] => {
  const points: THREE.Vector3[] = []

  if (trackType === 'oval') {
    // Simple oval track
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2
      const x = Math.cos(angle) * 200
      const z = Math.sin(angle) * 150
      const y = Math.sin(angle * 2) * 5 // Small elevation change
      points.push(new THREE.Vector3(x, y, z))
    }
  } else {
    // More complex circuit track
    for (let i = 0; i < 150; i++) {
      const t = i / 150
      const angle = t * Math.PI * 4
      const radius = 150 + Math.sin(angle * 2) * 50
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = Math.sin(t * Math.PI * 3) * 10
      points.push(new THREE.Vector3(x, y, z))
    }
  }

  return points
}

const tracks: Track[] = [
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    description: 'Historic British Grand Prix circuit',
    country: 'United Kingdom',
    length: 5891,
    turns: 18,
    elevation: 15,
    difficulty: 'hard',
    points: generateTrackPoints('circuit'),
    bestTime: 89.3,
    weather: 'cloudy',
    temperature: 18,
    environment: 'forest'
  },
  {
    id: 'nurburgring',
    name: 'Nürburgring Nordschleife',
    description: 'The legendary Green Hell',
    country: 'Germany',
    length: 20832,
    turns: 154,
    elevation: 300,
    difficulty: 'extreme',
    points: generateTrackPoints('circuit'),
    bestTime: 415.2,
    weather: 'foggy',
    temperature: 12,
    environment: 'forest'
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    description: 'Street circuit in Monte Carlo',
    country: 'Monaco',
    length: 3337,
    turns: 19,
    elevation: 42,
    difficulty: 'extreme',
    points: generateTrackPoints('circuit'),
    bestTime: 72.8,
    weather: 'sunny',
    temperature: 24,
    environment: 'city'
  }
]

const aiDriverNames = [
  'Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Carlos Sainz',
  'Lando Norris', 'George Russell', 'Sergio Perez', 'Fernando Alonso',
  'Esteban Ocon', 'Pierre Gasly', 'Yuki Tsunoda', 'Valtteri Bottas'
]

export function Racing3DEnhanced() {
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'garage' | 'track_select' | 'race' | 'paused' | 'results'>('menu')
  const [gameMode, setGameMode] = useState<'circuit' | 'drift' | 'timeAttack' | 'battleRoyale'>('circuit') // NEW: Game Modes
  const [selectedCar, setSelectedCar] = useState<CarConfiguration>(carConfigurations[0])
  const [selectedTrack, setSelectedTrack] = useState<Track>(tracks[0])
  const [raceStats, setRaceStats] = useState<RaceStats>({
    position: 1,
    totalPositions: 12,
    lapTime: 0,
    bestLap: 0,
    totalTime: 0,
    lap: 1,
    totalLaps: 5,
    speed: 0,
    distance: 0,
    fuel: 100,
    tireWear: [100, 100, 100, 100],
    penalties: 0,
    points: 0,
    driftScore: 0,
    sectorsTime: [0, 0, 0],
    topSpeed: 0,
    averageSpeed: 0,
    consistency: 100,
    nitroLevel: 100, // NEW
    isDrifting: false // NEW
  })

  // 3D Scene
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const carMeshRef = useRef<THREE.Group | null>(null)
  const trackMeshRef = useRef<THREE.Group | null>(null)
  const aiCarsRef = useRef<THREE.Group[]>([])
  const animationIdRef = useRef<number>()

  // Physics
  const [carPhysics, setCarPhysics] = useState<CarPhysics>({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    mass: selectedCar.chassis.weight,
    drag: selectedCar.aerodynamics.dragCoefficient,
    downforce: selectedCar.aerodynamics.downforceCoefficient,
    wheelSpinLoss: 0,
    wheelTraction: 1,
    brakeForce: selectedCar.brakes.power,
    enginePower: selectedCar.engine.power,
    transmissionEfficiency: 0.95,
    gear: 1,
    rpm: 1000,
    fuel: 100,
    temperature: 90,
    tire: [
      { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
      { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
      { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
      { wear: 100, grip: 1, pressure: 2.2, temperature: 80 }
    ],
    drift: 0, // NEW
    nitro: 100 // NEW
  })

  // AI Opponents
  const [aiDrivers, setAiDrivers] = useState<AIDriver[]>([])

  // Input State
  const [input, setInput] = useState({
    throttle: 0,
    brake: 0,
    steering: 0,
    clutch: 0,
    handbrake: false,
    gearUp: false,
    gearDown: false
  })

  // Initialize 3D Scene
  const init3DScene = useCallback(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x87CEEB, 100, 1000)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, -10)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    scene.add(directionalLight)

    // Create Track
    createTrack()

    // Create Player Car
    createPlayerCar()

    // Create AI Cars
    createAICars()

    // Create Environment
    createEnvironment()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Create Track
  const createTrack = useCallback(() => {
    if (!sceneRef.current) return

    const trackGroup = new THREE.Group()
    trackMeshRef.current = trackGroup

    // Track surface
    const trackGeometry = new THREE.PlaneGeometry(500, 300, 50, 30)
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    })
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial)
    trackMesh.rotation.x = -Math.PI / 2
    trackMesh.receiveShadow = true
    trackGroup.add(trackMesh)

    // Track borders
    const borderGeometry = new THREE.BoxGeometry(500, 2, 5)
    const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })

    const leftBorder = new THREE.Mesh(borderGeometry, borderMaterial)
    leftBorder.position.set(0, 1, -152.5)
    leftBorder.castShadow = true
    trackGroup.add(leftBorder)

    const rightBorder = new THREE.Mesh(borderGeometry, borderMaterial)
    rightBorder.position.set(0, 1, 152.5)
    rightBorder.castShadow = true
    trackGroup.add(rightBorder)

    // Track lines
    const lineGeometry = new THREE.PlaneGeometry(500, 1)
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    })

    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial)
    centerLine.rotation.x = -Math.PI / 2
    centerLine.position.y = 0.01
    trackGroup.add(centerLine)

    sceneRef.current.add(trackGroup)
  }, [])

  // Create Player Car
  const createPlayerCar = useCallback(() => {
    if (!sceneRef.current) return

    const carGroup = new THREE.Group()
    carMeshRef.current = carGroup

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4, 1, 8)
    const carColor = selectedCar.manufacturer === 'McLaren' ? 0xff6600 :
                     selectedCar.manufacturer === 'Red Bull Racing' ? 0x0066cc : 0xcc0000
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: carColor })
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
    carBody.position.y = 0.5
    carBody.castShadow = true
    carGroup.add(carBody)

    // Car details
    const cockpitGeometry = new THREE.BoxGeometry(3, 0.8, 3)
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2
    })
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial)
    cockpit.position.set(0, 1.2, -1)
    carGroup.add(cockpit)

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 })

    const wheelPositions = [
      { x: -1.5, y: 0.3, z: 2.5 },
      { x: 1.5, y: 0.3, z: 2.5 },
      { x: -1.5, y: 0.3, z: -2.5 },
      { x: 1.5, y: 0.3, z: -2.5 }
    ]

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.position.set(pos.x, pos.y, pos.z)
      wheel.rotation.z = Math.PI / 2
      wheel.castShadow = true
      carGroup.add(wheel)
    })

    // Lights
    const frontLightGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.2)
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    })

    const leftLight = new THREE.Mesh(frontLightGeometry, lightMaterial)
    leftLight.position.set(-1, 0.7, 4)
    carGroup.add(leftLight)

    const rightLight = new THREE.Mesh(frontLightGeometry, lightMaterial)
    rightLight.position.set(1, 0.7, 4)
    carGroup.add(rightLight)

    sceneRef.current.add(carGroup)
  }, [selectedCar])

  // Create AI Cars
  const createAICars = useCallback(() => {
    if (!sceneRef.current) return

    const aiCars: THREE.Group[] = []
    const newAIDrivers: AIDriver[] = []

    // Create AI drivers with different skill levels
    for (let i = 0; i < 7; i++) {
      const aiGroup = new THREE.Group()

      // AI Car body (simpler than player car)
      const bodyGeometry = new THREE.BoxGeometry(3.5, 0.8, 7)
      const carColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff]
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: carColors[i] })
      const aiBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
      aiBody.position.y = 0.4
      aiBody.castShadow = true
      aiGroup.add(aiBody)

      // Add wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12)
      const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })

      const wheelPositions = [
        { x: -1.2, y: 0.2, z: 2 },
        { x: 1.2, y: 0.2, z: 2 },
        { x: -1.2, y: 0.2, z: -2 },
        { x: 1.2, y: 0.2, z: -2 }
      ]

      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
        wheel.position.set(pos.x, pos.y, pos.z)
        wheel.rotation.z = Math.PI / 2
        wheel.castShadow = true
        aiGroup.add(wheel)
      })

      // Position AI cars at different starting positions
      const startAngle = (i / 7) * Math.PI * 2
      const startRadius = 180
      aiGroup.position.set(
        Math.cos(startAngle) * startRadius,
        0,
        Math.sin(startAngle) * startRadius
      )
      aiGroup.rotation.y = startAngle + Math.PI / 2

      sceneRef.current.add(aiGroup)
      aiCars.push(aiGroup)

      // Create AI driver data
      const aiDriver: AIDriver = {
        id: `ai_${i}`,
        name: aiDriverNames[i] || `AI Driver ${i + 1}`,
        skill: 60 + Math.random() * 40, // 60-100 skill
        aggression: 20 + Math.random() * 60, // 20-80 aggression
        consistency: 50 + Math.random() * 50, // 50-100 consistency
        style: ['aggressive', 'defensive', 'tactical', 'smooth'][Math.floor(Math.random() * 4)] as any,
        car: carConfigurations[Math.floor(Math.random() * carConfigurations.length)],
        physics: {
          position: new THREE.Vector3(
            Math.cos(startAngle) * startRadius,
            0,
            Math.sin(startAngle) * startRadius
          ),
          velocity: new THREE.Vector3(0, 0, 0),
          acceleration: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Euler(0, startAngle + Math.PI / 2, 0),
          angularVelocity: new THREE.Vector3(0, 0, 0),
          mass: 1200,
          drag: 0.3,
          downforce: 0.5,
          wheelSpinLoss: 0,
          wheelTraction: 1,
          brakeForce: 1500,
          enginePower: 500,
          transmissionEfficiency: 0.9,
          gear: 1,
          rpm: 1000,
          fuel: 100,
          temperature: 90,
          tire: [
            { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
            { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
            { wear: 100, grip: 1, pressure: 2.2, temperature: 80 },
            { wear: 100, grip: 1, pressure: 2.2, temperature: 80 }
          ]
        },
        position: i + 2,
        lapTime: [],
        penalties: 0,
        targetPointIndex: Math.floor(Math.random() * selectedTrack.points.length)
      }
      newAIDrivers.push(aiDriver)
    }

    aiCarsRef.current = aiCars
    setAiDrivers(newAIDrivers)
  }, [selectedTrack])

  // Create Environment
  const createEnvironment = useCallback(() => {
    if (!sceneRef.current) return

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5f3a,
      roughness: 0.9
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    sceneRef.current.add(ground)

    // Some trees/environment objects
    for (let i = 0; i < 20; i++) {
      const treeGeometry = new THREE.ConeGeometry(3, 8, 8)
      const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d })
      const tree = new THREE.Mesh(treeGeometry, treeMaterial)

      const angle = Math.random() * Math.PI * 2
      const distance = 300 + Math.random() * 200
      tree.position.set(
        Math.cos(angle) * distance,
        4,
        Math.sin(angle) * distance
      )
      tree.castShadow = true
      tree.receiveShadow = true
      sceneRef.current.add(tree)
    }
  }, [])

  // Update AI Drivers
  const updateAIDrivers = useCallback((deltaTime: number) => {
    const dt = deltaTime / 1000

    aiDrivers.forEach((ai, index) => {
      const aiCar = aiCarsRef.current[index]
      if (!aiCar || !selectedTrack.points.length) return

      // Simple AI: follow track points
      const targetPoint = selectedTrack.points[ai.targetPointIndex]
      const direction = new THREE.Vector3().subVectors(targetPoint, ai.physics.position)
      const distance = direction.length()

      // Update target point if close enough
      if (distance < 20) {
        ai.targetPointIndex = (ai.targetPointIndex + 1) % selectedTrack.points.length
      }

      // Calculate desired direction
      direction.normalize()
      const desiredRotation = Math.atan2(direction.x, direction.z)

      // Smooth rotation
      const currentRotation = ai.physics.rotation.y
      let rotationDiff = desiredRotation - currentRotation

      // Normalize rotation difference
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

      const newRotation = currentRotation + rotationDiff * dt * 2 // Smooth turning
      ai.physics.rotation.y = newRotation

      // Calculate speed based on skill and track
      const baseSpeed = (ai.skill / 100) * 80 + 20 // 20-100 m/s based on skill
      const corneringFactor = Math.abs(rotationDiff) > 0.5 ? 0.6 : 1.0 // Slow down for corners
      const currentSpeed = baseSpeed * corneringFactor

      // Update position
      const velocity = new THREE.Vector3(
        Math.sin(newRotation) * currentSpeed,
        0,
        Math.cos(newRotation) * currentSpeed
      )

      ai.physics.position.add(velocity.clone().multiplyScalar(dt))
      ai.physics.velocity = velocity

      // Update 3D mesh position
      if (aiCar) {
        aiCar.position.copy(ai.physics.position)
        aiCar.rotation.y = newRotation
      }

      // Add some variation to make it more realistic
      if (Math.random() < 0.01) { // 1% chance per frame
        ai.physics.position.x += (Math.random() - 0.5) * 2 // Small lateral movement
        ai.physics.position.z += (Math.random() - 0.5) * 2 // Small longitudinal movement
      }
    })
  }, [aiDrivers, selectedTrack])

  // Update Physics
  const updatePhysics = useCallback((deltaTime: number) => {
    const dt = deltaTime / 1000

    // Simplified physics for player car
    const throttleInput = input.throttle
    const brakeInput = input.brake
    const steeringInput = input.steering

    // Calculate forces
    const maxSpeed = 150 // m/s (540 km/h)
    const acceleration = throttleInput * 15 // m/s²
    const braking = brakeInput * 25 // m/s²
    const steering = steeringInput * 2 // rad/s

    // Update velocity
    if (throttleInput > 0) {
      const forwardVelocity = new THREE.Vector3(0, 0, acceleration * dt)
      forwardVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), carPhysics.rotation.y)
      carPhysics.velocity.add(forwardVelocity)
    }

    if (brakeInput > 0) {
      carPhysics.velocity.multiplyScalar(1 - braking * dt)
    }

    // Apply drag
    carPhysics.velocity.multiplyScalar(1 - 0.1 * dt)

    // Limit speed
    const speed = carPhysics.velocity.length()
    if (speed > maxSpeed) {
      carPhysics.velocity.normalize().multiplyScalar(maxSpeed)
    }

    // Update position
    carPhysics.position.add(carPhysics.velocity.clone().multiplyScalar(dt))

    // Update rotation based on steering and speed
    if (Math.abs(steering) > 0.01 && speed > 1) {
      const turnRadius = speed / Math.abs(steering)
      const angularVelocity = speed / turnRadius
      carPhysics.rotation.y += steering * dt
    }

    // Keep car on track (simple boundary check)
    const maxDistance = 200
    const distanceFromCenter = Math.sqrt(
      carPhysics.position.x * carPhysics.position.x +
      carPhysics.position.z * carPhysics.position.z
    )

    if (distanceFromCenter > maxDistance) {
      carPhysics.position.normalize().multiplyScalar(maxDistance)
      carPhysics.velocity.multiplyScalar(0.5) // Slow down when hitting boundary
    }

    // Update 3D mesh
    if (carMeshRef.current) {
      carMeshRef.current.position.copy(carPhysics.position)
      carMeshRef.current.rotation.y = carPhysics.rotation.y
    }

    // Update camera to follow car
    if (cameraRef.current) {
      const cameraOffset = new THREE.Vector3(0, 8, -15)
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carPhysics.rotation.y)
      cameraRef.current.position.lerp(
        carPhysics.position.clone().add(cameraOffset),
        0.1
      )
      cameraRef.current.lookAt(carPhysics.position)
    }

    // Update race stats
    setRaceStats(prev => ({
      ...prev,
      speed: speed * 3.6, // Convert to km/h
      topSpeed: Math.max(prev.topSpeed, speed * 3.6),
      distance: prev.distance + speed * dt
    }))
  }, [input, carPhysics])

  // Animation Loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const deltaTime = 16 // ~60 FPS

    // Update physics
    updatePhysics(deltaTime)
    updateAIDrivers(deltaTime)

    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current)

    animationIdRef.current = requestAnimationFrame(animate)
  }, [updatePhysics, updateAIDrivers])

  // Start race
  const startRace = useCallback(() => {
    setGameState('race')

    // Initialize 3D scene if not already done
    if (!sceneRef.current) {
      const cleanup = init3DScene()
      setTimeout(() => {
        animate()
      }, 100)
    } else {
      animate()
    }
  }, [init3DScene, animate])

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
  }, [])

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setInput(prev => ({ ...prev, throttle: 1 }))
          break
        case 's':
        case 'arrowdown':
          setInput(prev => ({ ...prev, brake: 1 }))
          break
        case 'a':
        case 'arrowleft':
          setInput(prev => ({ ...prev, steering: -1 }))
          break
        case 'd':
        case 'arrowright':
          setInput(prev => ({ ...prev, steering: 1 }))
          break
        case ' ':
          setInput(prev => ({ ...prev, handbrake: true }))
          break
        case 'escape':
          if (gameState === 'race') {
            setGameState('paused')
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setInput(prev => ({ ...prev, throttle: 0 }))
          break
        case 's':
        case 'arrowdown':
          setInput(prev => ({ ...prev, brake: 0 }))
          break
        case 'a':
        case 'arrowleft':
        case 'd':
        case 'arrowright':
          setInput(prev => ({ ...prev, steering: 0 }))
          break
        case ' ':
          setInput(prev => ({ ...prev, handbrake: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation()
    }
  }, [stopAnimation])

  // Main Menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
          >
            RACING 3D ENHANCED
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Echte 3D-Grafik mit KI-Gegnern und realistischer Physik
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 text-lg"
              onClick={() => setGameState('garage')}
            >
              <Car className="h-5 w-5 mr-2" />
              GARAGE
            </Button>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
              onClick={() => setGameState('track_select')}
            >
              <Flag className="h-5 w-5 mr-2" />
              STRECKE WÄHLEN
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={startRace}
            >
              <Play className="h-5 w-5 mr-2" />
              SCHNELLSTART
            </Button>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <CircuitBoard className="h-5 w-5" />
                  Echte 3D-Grafik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Three.js Engine mit realistischen Schatten, Lichtern und Physik
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  KI-Gegner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  7 intelligente KI-Gegner mit unterschiedlichen Fahrstilen und Skill-Leveln
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Realistische Physik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Authentische Fahrzeugdynamik mit Reifenphysik und Aerodynamik
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Garage Screen (same as original but simplified)
  if (gameState === 'garage') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Garage</h1>
            <Button variant="outline" onClick={() => setGameState('menu')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {carConfigurations.map((car) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedCar(car)}
              >
                <Card className={`border-2 transition-all duration-300 ${
                  selectedCar.id === car.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 bg-gray-800/50'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        car.class === 'formula' ? 'bg-red-500' :
                        car.class === 'sport' ? 'bg-orange-500' :
                        car.class === 'drift' ? 'bg-purple-500' : 'bg-blue-500'
                      } text-white capitalize`}>
                        {car.class}
                      </Badge>
                      <Badge variant="outline">{car.manufacturer}</Badge>
                    </div>
                    <CardTitle className="text-white">{car.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Power:</span>
                        <span className="text-white ml-2">{car.engine.power} HP</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Weight:</span>
                        <span className="text-white ml-2">{car.chassis.weight} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Engine:</span>
                        <span className="text-white ml-2 capitalize">{car.engine.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Transmission:</span>
                        <span className="text-white ml-2">{car.transmission.gears}G {car.transmission.type}</span>
                      </div>
                    </div>

                    {selectedCar.id === car.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-gray-600 pt-4"
                      >
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={() => setGameState('track_select')}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Strecke wählen
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Track Selection (simplified)
  if (gameState === 'track_select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-green-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Strecken-Auswahl</h1>
            <Button variant="outline" onClick={() => setGameState('garage')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {tracks.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedTrack(track)}
              >
                <Card className={`border-2 transition-all duration-300 ${
                  selectedTrack.id === track.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-800/50'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        track.difficulty === 'easy' ? 'bg-green-500' :
                        track.difficulty === 'medium' ? 'bg-yellow-500' :
                        track.difficulty === 'hard' ? 'bg-orange-500' : 'bg-red-500'
                      } text-white capitalize`}>
                        {track.difficulty}
                      </Badge>
                      <Badge variant="outline">{track.country}</Badge>
                    </div>
                    <CardTitle className="text-white">{track.name}</CardTitle>
                    <p className="text-gray-400 text-sm">{track.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Length:</span>
                        <span className="text-white ml-2">{(track.length / 1000).toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Turns:</span>
                        <span className="text-white ml-2">{track.turns}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Best Time:</span>
                        <span className="text-white ml-2">{(track.bestTime / 60).toFixed(1)}m</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Weather:</span>
                        <span className="text-white ml-2 capitalize">{track.weather}</span>
                      </div>
                    </div>

                    {selectedTrack.id === track.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-gray-600 pt-4"
                      >
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={startRace}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          RENNEN STARTEN
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Race Screen
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Speed and Gear Display */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-white font-mono text-2xl font-bold">
            {Math.round(raceStats.speed)} km/h
          </div>
          <div className="text-orange-400 font-mono text-lg">
            Gear {carPhysics.gear}
          </div>
        </div>

        {/* Position Display */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-white font-mono text-xl">
            Position: {raceStats.position}/12
          </div>
          <div className="text-green-400 font-mono">
            Lap {raceStats.lap}/5
          </div>
        </div>

        {/* Controls Info */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm font-mono">
            WASD/Arrows: Drive | Space: Handbrake | ESC: Pause
          </div>
        </div>

        {/* AI Opponents Info */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-yellow-400 text-sm font-mono">
            🤖 7 KI-Gegner im Rennen
          </div>
        </div>
      </div>

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/75 flex items-center justify-center"
        >
          <Card className="bg-gray-900 border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-400 text-center">Race Paused</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center">
              <Button
                onClick={() => setGameState('race')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGameState('menu')
                  stopAnimation()
                }}
              >
                Main Menu
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}