// @ts-nocheck
'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, TransformControls, Environment, Sky } from '@react-three/drei'
import * as THREE from 'three'

// Enhanced Map Object interface with more types
interface MapObject {
  id: string
  type: 'building' | 'crate' | 'barrel' | 'tire' | 'debris' | 'sandbag' | 'fence' | 'door' | 'window' | 'container' | 'wall' | 'barricade' | 'vehicle' | 'tree' | 'streetlight'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
  texture?: string
}

// Map Template interface
interface MapTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  objects: MapObject[]
  author: string
  difficulty: 'easy' | 'medium' | 'hard'
  gameMode: 'deathmatch' | 'capture' | 'search' | 'all'
  playerCount: number
}

// Built-in templates with your maps
const BUILTIN_TEMPLATES: MapTemplate[] = [
  {
    id: 'dead_city',
    name: 'Dead City',
    description: 'Apocalyptic urban environment with destroyed buildings and debris from your map collection',
    thumbnail: '/data/map-templates/textures/rp_deadcity_texture_0.png',
    author: 'DigitalExplorations',
    difficulty: 'hard',
    gameMode: 'all',
    playerCount: 16,
    objects: [
      // Central destroyed buildings
      {
        id: 'bld1',
        type: 'building',
        position: [0, 6, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4a4a4a'
      },
      {
        id: 'bld2',
        type: 'building',
        position: [15, 4, 10],
        rotation: [0, Math.PI / 4, 0],
        scale: [0.8, 0.7, 0.8],
        color: '#5a5a5a'
      },
      // Street barricades
      {
        id: 'barr1',
        type: 'barricade',
        position: [10, 1, -5],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#8b4513'
      },
      // Debris fields
      {
        id: 'deb1',
        type: 'debris',
        position: [5, 0.5, 8],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#696969'
      },
      // Destroyed vehicles
      {
        id: 'veh1',
        type: 'vehicle',
        position: [-8, 1, 12],
        rotation: [0, Math.PI / 6, 0],
        scale: [1, 1, 1],
        color: '#2c2c2c'
      },
      // Wreckage containers
      {
        id: 'cont1',
        type: 'container',
        position: [-12, 2, -8],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ff6b35'
      },
      // Street lights
      {
        id: 'light1',
        type: 'streetlight',
        position: [20, 4, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ffd700'
      },
      // Trees
      {
        id: 'tree1',
        type: 'tree',
        position: [-15, 3, -15],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#228b22'
      }
    ]
  },
  {
    id: 'police_office',
    name: 'Police Office',
    description: 'Law enforcement station with tactical positions and cover',
    thumbnail: '/data/map-templates/police-office/preview.jpg',
    author: 'GLGY Gaming',
    difficulty: 'medium',
    gameMode: 'deathmatch',
    playerCount: 12,
    objects: [
      // Main police building
      {
        id: 'police_main',
        type: 'building',
        position: [0, 5, 0],
        rotation: [0, 0, 0],
        scale: [1.5, 1.2, 1],
        color: '#1e3a8a'
      },
      // Parking lot with vehicles
      {
        id: 'police_car1',
        type: 'vehicle',
        position: [15, 1, 8],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#1e40af'
      },
      {
        id: 'police_car2',
        type: 'vehicle',
        position: [15, 1, 12],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#1e40af'
      },
      // Barricades and barriers
      {
        id: 'police_barricade1',
        type: 'barricade',
        position: [-10, 1, -5],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
        color: '#fbbf24'
      },
      // Storage containers
      {
        id: 'police_storage',
        type: 'container',
        position: [-15, 2, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#6b7280'
      },
      // Street lights
      {
        id: 'police_light1',
        type: 'streetlight',
        position: [20, 4, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ffffff'
      }
    ]
  },
  {
    id: 'neon_pvp_pve',
    name: 'Neon PvP/PVE Arena',
    description: 'Futuristic cyberpunk arena with neon lighting and tactical gameplay',
    thumbnail: '/data/map-templates/fps-map-pvp-pve-game-neon/preview.jpg',
    author: 'GLXY Gaming',
    difficulty: 'hard',
    gameMode: 'all',
    playerCount: 20,
    objects: [
      // Central neon platform
      {
        id: 'neon_center',
        type: 'building',
        position: [0, 3, 0],
        rotation: [0, 0, 0],
        scale: [2, 0.5, 2],
        color: '#ec4899'
      },
      // Neon towers
      {
        id: 'neon_tower1',
        type: 'building',
        position: [-20, 8, -20],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 0.5],
        color: '#8b5cf6'
      },
      {
        id: 'neon_tower2',
        type: 'building',
        position: [20, 8, 20],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 0.5],
        color: '#3b82f6'
      },
      // Cyber barriers
      {
        id: 'neon_barrier1',
        type: 'barricade',
        position: [10, 1, 0],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#f59e0b'
      },
      // Tech containers
      {
        id: 'neon_container1',
        type: 'container',
        position: [-12, 2, 8],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
        color: '#10b981'
      },
      // Future vehicles
      {
        id: 'neon_vehicle1',
        type: 'vehicle',
        position: [0, 1, 15],
        rotation: [0, Math.PI, 0],
        scale: [1.2, 1, 1.5],
        color: '#ef4444'
      },
      // Neon street lights
      {
        id: 'neon_light1',
        type: 'streetlight',
        position: [15, 5, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#a855f7'
      },
      {
        id: 'neon_light2',
        type: 'streetlight',
        position: [-15, 5, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#06b6d4'
      }
    ]
  },
  {
    id: 'urban_warfare',
    name: 'Urban Warfare',
    description: 'Modern city streets with tactical positions',
    thumbnail: '/data/map-templates/textures/rp_deadcity_texture_50.png',
    author: 'GLXY Gaming',
    difficulty: 'medium',
    gameMode: 'deathmatch',
    playerCount: 12,
    objects: [
      // Office buildings
      {
        id: 'office1',
        type: 'building',
        position: [-20, 8, -20],
        rotation: [0, 0, 0],
        scale: [1.2, 1.5, 1],
        color: '#708090'
      },
      {
        id: 'office2',
        type: 'building',
        position: [20, 8, -20],
        rotation: [0, 0, 0],
        scale: [1.2, 1.5, 1],
        color: '#708090'
      },
      // Cover walls
      {
        id: 'wall1',
        type: 'wall',
        position: [0, 2, 0],
        rotation: [0, 0, 0],
        scale: [3, 1, 0.2],
        color: '#8b7355'
      },
      // Tactical crates
      {
        id: 'tact1',
        type: 'crate',
        position: [5, 1, 5],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
        color: '#cd853f'
      },
      // Barriers
      {
        id: 'barrier1',
        type: 'barricade',
        position: [-5, 1, -5],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#4169e1'
      }
    ]
  },
  {
    id: 'industrial_complex',
    name: 'Industrial Complex',
    description: 'Factory area with machinery and containers',
    thumbnail: '/data/map-templates/textures/rp_deadcity_texture_25.png',
    author: 'GLXY Gaming',
    difficulty: 'medium',
    gameMode: 'capture',
    playerCount: 14,
    objects: [
      // Factory buildings
      {
        id: 'factory1',
        type: 'building',
        position: [0, 6, 0],
        rotation: [0, 0, 0],
        scale: [2, 1, 1.5],
        color: '#696969'
      },
      // Storage containers
      {
        id: 'storage1',
        type: 'container',
        position: [15, 2, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ff4500'
      },
      {
        id: 'storage2',
        type: 'container',
        position: [15, 4, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4169e1'
      },
      // Industrial equipment
      {
        id: 'equip1',
        type: 'vehicle',
        position: [-10, 1, -8],
        rotation: [0, Math.PI / 3, 0],
        scale: [1.5, 1, 1],
        color: '#2f4f4f'
      },
      // Safety barriers
      {
        id: 'safe1',
        type: 'barricade',
        position: [8, 1, -12],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        color: '#ffa500'
      }
    ]
  }
]

// Enhanced object rendering function
function RenderMapObject({ object, isSelected, onClick }: {
  object: MapObject
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.01
    }
  })

  const handleClick = (e: THREE.Event) => {
    if ('stopPropagation' in e) {
      (e as any).stopPropagation()
    }
    onClick()
  }

  switch (object.type) {
    case 'building':
      return (
        <mesh
          ref={meshRef}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[12, 8, 12]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.7}
            emissive={isSelected ? '#444444' : '#000000'}
            emissiveIntensity={isSelected ? 0.2 : 0}
          />
          {/* Windows */}
          {[[-5, 2, 6], [0, 2, 6], [5, 2, 6]].map((pos, i) => (
            <mesh key={`window-${i}`} position={pos as [number, number, number]}>
              <boxGeometry args={[1.5, 2, 0.2]} />
              <meshStandardMaterial color="#87ceeb" emissive="#4682b4" emissiveIntensity={0.1} />
            </mesh>
          ))}
        </mesh>
      )

    case 'container':
      return (
        <mesh
          ref={meshRef}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[6, 4, 3]} />
          <meshStandardMaterial
            color={object.color || '#ff6b35'}
            roughness={0.6}
            metalness={0.8}
            emissive={isSelected ? '#ff6b35' : '#000000'}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
          {/* Container details */}
          <mesh position={[0, 0, 1.51]}>
            <boxGeometry args={[5.8, 3.8, 0.1]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </mesh>
      )

    case 'vehicle':
      return (
        <group
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
        >
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[4, 1.5, 8]} />
            <meshStandardMaterial
              color={object.color || '#2c2c2c'}
              roughness={0.8}
              emissive={isSelected ? '#ff0000' : '#000000'}
              emissiveIntensity={isSelected ? 0.1 : 0}
            />
          </mesh>
          {/* Vehicle details */}
          <mesh position={[0, 1.2, 2]} castShadow>
            <boxGeometry args={[3.5, 0.8, 3]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1.5, 0.3, 3]}>
            <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[1.5, 0.3, -3]}>
            <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[-1.5, 0.3, 3]}>
            <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[-1.5, 0.3, -3]}>
            <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      )

    case 'wall':
      return (
        <mesh
          ref={meshRef}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 4, 0.3]} />
          <meshStandardMaterial
            color={object.color || '#8b7355'}
            roughness={0.9}
            emissive={isSelected ? '#8b7355' : '#000000'}
            emissiveIntensity={isSelected ? 0.2 : 0}
          />
        </mesh>
      )

    case 'barricade':
      return (
        <group
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
        >
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[3, 1.5, 0.5]} />
            <meshStandardMaterial
              color={object.color || '#ff6347'}
              roughness={0.8}
              emissive={isSelected ? '#ff6347' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </mesh>
          {/* Barricade stripes */}
          <mesh position={[0, 0.8, 0.26]}>
            <boxGeometry args={[3, 0.3, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.3, 0.26]}>
            <boxGeometry args={[3, 0.3, 0.1]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      )

    case 'streetlight':
      return (
        <group
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
        >
          <mesh ref={meshRef} castShadow receiveShadow>
            <cylinderGeometry args={[0.15, 0.15, 8]} />
            <meshStandardMaterial color="#2c2c2c" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light */}
          <mesh position={[0, 7, 0]}>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial
              color={object.color || '#ffd700'}
              emissive={object.color || '#ffd700'}
              emissiveIntensity={0.8}
            />
          </mesh>
          {/* Light arm */}
          <mesh position={[2, 7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="#2c2c2c" />
          </mesh>
        </group>
      )

    case 'tree':
      return (
        <group
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
        >
          <mesh ref={meshRef} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.7, 6]} />
            <meshStandardMaterial color="#8b4513" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <sphereGeometry args={[2.5, 8, 6]} />
            <meshStandardMaterial
              color={object.color || '#228b22'}
              roughness={0.8}
              emissive={isSelected ? '#228b22' : '#000000'}
              emissiveIntensity={isSelected ? 0.1 : 0}
            />
          </mesh>
        </group>
      )

    default:
      return (
        <mesh
          ref={meshRef}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color={object.color || '#808080'}
            roughness={0.5}
            emissive={isSelected ? '#ffffff' : '#000000'}
            emissiveIntensity={isSelected ? 0.2 : 0}
          />
        </mesh>
      )
  }
}

// Scene component
function MapScene({
  objects,
  selectedObject,
  onSelectObject,
  transformMode,
  onUpdateObject,
  cameraMode
}: {
  objects: MapObject[]
  selectedObject: MapObject | null
  onSelectObject: (object: MapObject | null) => void
  transformMode: 'translate' | 'rotate' | 'scale'
  onUpdateObject: (object: MapObject) => void
  cameraMode: 'free' | 'fps'
}) {
  const { camera, gl } = useThree()

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
      />

      {cameraMode === 'free' && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={200}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.5}
          enableDamping={true}
          dampingFactor={0.05}
          zoomSpeed={0.8}
          panSpeed={1}
          rotateSpeed={0.5}
        />
      )}

      <TransformControls
        object={selectedObject ?
          (document.querySelector(`[data-object-id="${selectedObject.id}"]`) as any) :
          null
        }
        mode={transformMode}
        onObjectChange={() => {
          if (selectedObject) {
            // Update object position when transform controls change
            onUpdateObject(selectedObject)
          }
        }}
      />

      {objects.map((object) => (
        <RenderMapObject
          key={object.id}
          object={object}
          isSelected={selectedObject?.id === object.id}
          onClick={() => onSelectObject(object)}
        />
      ))}

      <fog attach="fog" args={['#1a202c', 50, 200]} />
    </>
  )
}

// FPS Controller component
function FPSController({ enabled, objects }: { enabled: boolean; objects: MapObject[] }) {
  const { camera, gl } = useThree()
  const cameraRef = useRef(camera)
  const moveSpeed = 0.1
  const mouseSensitivity = 0.002

  const [keys, setKeys] = useState({
    w: false, a: false, s: false, d: false,
    shift: false, space: false
  })

  const [mouseDown, setMouseDown] = useState(false)
  const [pitch, setPitch] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [position, setPosition] = useState([0, 2, 10])

  // Keyboard controls
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': setKeys(prev => ({ ...prev, w: true })); break
        case 'a': setKeys(prev => ({ ...prev, a: true })); break
        case 's': setKeys(prev => ({ ...prev, s: true })); break
        case 'd': setKeys(prev => ({ ...prev, d: true })); break
        case 'shift': setKeys(prev => ({ ...prev, shift: true })); break
        case ' ': setKeys(prev => ({ ...prev, space: true })); e.preventDefault(); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': setKeys(prev => ({ ...prev, w: false })); break
        case 'a': setKeys(prev => ({ ...prev, a: false })); break
        case 's': setKeys(prev => ({ ...prev, s: false })); break
        case 'd': setKeys(prev => ({ ...prev, d: false })); break
        case 'shift': setKeys(prev => ({ ...prev, shift: false })); break
        case ' ': setKeys(prev => ({ ...prev, space: false })); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])

  // Mouse controls
  useEffect(() => {
    if (!enabled) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        setMouseDown(true)
        gl.domElement.requestPointerLock()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setMouseDown(false)
        document.exitPointerLock()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDown || !document.pointerLockElement) return

      const movementX = e.movementX || 0
      const movementY = e.movementY || 0

      setYaw(prev => prev - movementX * mouseSensitivity)
      setPitch(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - movementY * mouseSensitivity)))
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enabled, mouseDown, gl.domElement])

  // Movement
  useFrame(() => {
    if (!enabled) return

    const newPosition = [...position] as [number, number, number]
    const speed = keys.shift ? moveSpeed * 1.5 : moveSpeed
    const jumpSpeed = keys.space ? 0.3 : 0

    let moveX = 0
    let moveZ = 0

    if (keys.w) {
      moveX += Math.sin(yaw) * speed
      moveZ += Math.cos(yaw) * speed
    }
    if (keys.s) {
      moveX -= Math.sin(yaw) * speed
      moveZ -= Math.cos(yaw) * speed
    }
    if (keys.a) {
      moveX += Math.sin(yaw - Math.PI / 2) * speed
      moveZ += Math.cos(yaw - Math.PI / 2) * speed
    }
    if (keys.d) {
      moveX += Math.sin(yaw + Math.PI / 2) * speed
      moveZ += Math.cos(yaw + Math.PI / 2) * speed
    }

    newPosition[0] += moveX
    newPosition[2] += moveZ

    // Simple gravity and ground collision
    if (newPosition[1] > 2 || jumpSpeed > 0) {
      newPosition[1] -= 0.01
      if (newPosition[1] < 2) newPosition[1] = 2
    }
    if (jumpSpeed > 0 && newPosition[1] <= 2) {
      newPosition[1] += jumpSpeed
    }

    // Keep player in bounds
    newPosition[0] = Math.max(-50, Math.min(50, newPosition[0]))
    newPosition[2] = Math.max(-50, Math.min(50, newPosition[2]))

    cameraRef.current.position.set(...newPosition)
    cameraRef.current.rotation.order = 'YXZ'
    cameraRef.current.rotation.y = yaw
    cameraRef.current.rotation.x = pitch

    setPosition(newPosition)
  })

  return null
}

// Main Enhanced Map Editor Component
export default function EnhancedMapEditor() {
  const [objects, setObjects] = useState<MapObject[]>([])
  const [selectedObject, setSelectedObject] = useState<MapObject | null>(null)
  const [mode, setMode] = useState<'select' | 'add' | 'delete'>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<MapTemplate | null>(null)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [showTemplates, setShowTemplates] = useState(true)
  const [selectedObjectType, setSelectedObjectType] = useState<MapObject['type']>('building')
  const [cameraMode, setCameraMode] = useState<'free' | 'fps'>('free')

  const loadTemplate = (template: MapTemplate) => {
    setObjects([...template.objects])
    setSelectedTemplate(template)
    setSelectedObject(null)
    setShowTemplates(false)
  }

  const addObject = (type: MapObject['type']) => {
    const newObject: MapObject = {
      id: `${type}_${Date.now()}`,
      type,
      position: [Math.random() * 40 - 20, 2, Math.random() * 40 - 20],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: type === 'building' ? '#4a5568' :
             type === 'container' ? '#ff6b35' :
             type === 'vehicle' ? '#2c2c2c' : '#8b4513'
    }
    setObjects([...objects, newObject])
    setSelectedObject(newObject)
    setMode('select')
  }

  const deleteObject = (id: string) => {
    setObjects(objects.filter(obj => obj.id !== id))
    setSelectedObject(null)
  }

  const updateObject = (updatedObject: MapObject) => {
    setObjects(objects.map(obj =>
      obj.id === updatedObject.id ? updatedObject : obj
    ))
  }

  const clearMap = () => {
    setObjects([])
    setSelectedObject(null)
    setSelectedTemplate(null)
  }

  const exportMap = () => {
    const mapData = {
      name: selectedTemplate?.name || 'Custom Map',
      objects,
      timestamp: new Date().toISOString()
    }
    const dataStr = JSON.stringify(mapData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${selectedTemplate?.name || 'custom_map'}_${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getObjectStats = () => {
    const stats = objects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return stats
  }

  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Templates & Objects */}
        <div className="w-96 bg-gray-800 p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4 text-center">🗺️ Enhanced Map Editor</h1>

          {/* Camera Mode Toggle */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">📷 Camera Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCameraMode('free')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  cameraMode === 'free' ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                🎯 Free Camera
              </button>
              <button
                onClick={() => setCameraMode('fps')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  cameraMode === 'fps' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                👁️ FPS Mode
              </button>
            </div>
            {cameraMode === 'fps' && (
              <div className="mt-2 text-xs text-gray-400 bg-gray-700 p-2 rounded">
                <div>🎮 FPS Controls:</div>
                <div>• W/A/S/D: Move</div>
                <div>• Mouse: Look around</div>
                <div>• Shift: Sprint</div>
                <div>• Space: Jump</div>
                <div>• Click: Lock pointer</div>
              </div>
            )}
          </div>

          {/* Template Gallery */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">📚 Map Templates</h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                {showTemplates ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTemplates && (
              <div className="space-y-3">
                {BUILTIN_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 bg-gray-700 rounded-lg cursor-pointer transition-all hover:bg-gray-600 ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-16 h-16 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%234a5568"/%3E%3Ctext x="32" y="32" text-anchor="middle" fill="white" font-size="10" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-400 mb-1">{template.description}</p>
                        <div className="flex gap-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            template.difficulty === 'easy' ? 'bg-green-600' :
                            template.difficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}>
                            {template.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-blue-600 rounded">
                            {template.playerCount} players
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Mode */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🛠️ Edit Mode</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('select')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  mode === 'select' ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                ✋ Select
              </button>
              <button
                onClick={() => setMode('add')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  mode === 'add' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                ➕ Add
              </button>
              <button
                onClick={() => setMode('delete')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  mode === 'delete' ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Transform Controls */}
          {mode === 'select' && selectedObject && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🔄 Transform</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTransformMode('translate')}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    transformMode === 'translate' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  ↔️ Move
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    transformMode === 'rotate' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  🔄 Rotate
                </button>
                <button
                  onClick={() => setTransformMode('scale')}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    transformMode === 'scale' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  📏 Scale
                </button>
              </div>
            </div>
          )}

          {/* Object Types (for Add mode) */}
          {mode === 'add' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🎯 Object Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'building', icon: '🏢', name: 'Building' },
                  { type: 'container', icon: '📦', name: 'Container' },
                  { type: 'vehicle', icon: '🚗', name: 'Vehicle' },
                  { type: 'wall', icon: '🧱', name: 'Wall' },
                  { type: 'barricade', icon: '🚧', name: 'Barricade' },
                  { type: 'streetlight', icon: '💡', name: 'Streetlight' },
                  { type: 'tree', icon: '🌳', name: 'Tree' },
                  { type: 'crate', icon: '📦', name: 'Crate' },
                  { type: 'barrel', icon: '🛢️', name: 'Barrel' },
                  { type: 'tire', icon: '⭕', name: 'Tire' },
                  { type: 'debris', icon: '💥', name: 'Debris' },
                  { type: 'sandbag', icon: '👜', name: 'Sandbag' },
                  { type: 'fence', icon: '🚧', name: 'Fence' },
                  { type: 'door', icon: '🚪', name: 'Door' },
                  { type: 'window', icon: '🪟', name: 'Window' }
                ].map(({ type, icon, name }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedObjectType(type as MapObject['type'])
                      addObject(type as MapObject['type'])
                    }}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      selectedObjectType === type ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {icon} {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Object Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">📊 Map Statistics</h3>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-300 mb-2">
                Total Objects: <span className="font-semibold text-white">{objects.length}</span>
              </div>
              {Object.entries(getObjectStats()).map(([type, count]) => (
                <div key={type} className="text-xs text-gray-400">
                  {type}: <span className="text-gray-300">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={exportMap}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-sm"
            >
              💾 Export Map
            </button>
            <button
              onClick={clearMap}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-sm"
            >
              🗑️ Clear Map
            </button>
          </div>

          {/* Selected Object Info */}
          {selectedObject && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">🎯 Selected Object</h3>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm">
                  <div>ID: <span className="text-gray-400">{selectedObject.id}</span></div>
                  <div>Type: <span className="text-gray-400">{selectedObject.type}</span></div>
                  <div>Position: <span className="text-gray-400">
                    [{selectedObject.position.map(n => n.toFixed(1)).join(', ')}]
                  </span></div>
                  {mode === 'delete' && (
                    <button
                      onClick={() => deleteObject(selectedObject.id)}
                      className="mt-2 w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                    >
                      Delete This Object
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            camera={{
              position: cameraMode === 'free' ? [50, 30, 50] : [0, 5, 0],
              fov: 60
            }}
          >
            <Suspense fallback={null}>
              <MapScene
                objects={objects}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
                transformMode={transformMode}
                onUpdateObject={updateObject}
                cameraMode={cameraMode}
              />
              <FPSController enabled={cameraMode === 'fps'} objects={objects} />
            </Suspense>
          </Canvas>

          {/* Info Overlay */}
          <div className="absolute top-4 left-4 bg-gray-800/90 p-4 rounded-lg max-w-sm">
            <h2 className="text-xl font-bold mb-2">
              {selectedTemplate ? selectedTemplate.name : 'Custom Map'}
            </h2>
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                mode === 'select' ? 'bg-blue-600' :
                mode === 'add' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {mode === 'select' ? 'SELECT' : mode === 'add' ? 'ADD' : 'DELETE'} MODE
              </span>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                cameraMode === 'free' ? 'bg-purple-600' : 'bg-orange-600'
              }`}>
                {cameraMode === 'free' ? 'FREE CAM' : 'FPS MODE'}
              </span>
              {selectedTemplate && (
                <span className="px-3 py-1 rounded text-sm font-semibold bg-cyan-600">
                  TEMPLATE
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              <p>🗺️ Templates: {BUILTIN_TEMPLATES.length} available</p>
              <p>🎯 Objects: {objects.length} placed</p>
              {selectedTemplate && (
                <>
                  <p>👥 Players: {selectedTemplate.playerCount}</p>
                  <p>⚡ Difficulty: {selectedTemplate.difficulty}</p>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-gray-800/90 p-3 rounded-lg max-w-md">
            <h3 className="text-sm font-semibold mb-2">🎮 Controls:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="font-semibold text-blue-400">• Template Mode:</div>
              <div className="ml-2">Click template to load, then customize</div>
              <div className="font-semibold text-green-400">• Select Mode:</div>
              <div className="ml-2">Click objects to select and transform</div>
              <div className="font-semibold text-yellow-400">• Add Mode:</div>
              <div className="ml-2">Choose object type to add to map</div>
              <div className="font-semibold text-red-400">• Delete Mode:</div>
              <div className="ml-2">Click objects to remove them</div>
              <div className="font-semibold text-purple-400">• Camera:</div>
              <div className="ml-2">Left click + drag to rotate, scroll to zoom</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}