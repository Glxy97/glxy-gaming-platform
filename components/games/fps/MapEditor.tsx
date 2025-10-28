// @ts-nocheck
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid } from '@react-three/drei'
import * as THREE from 'three'

// Object types that can be created
export interface MapObject {
  id: string
  type: 'building' | 'crate' | 'wall' | 'tree' | 'light' | 'spawn' | 'vehicle' | 'weapon' | 'barrel' | 'tire' | 'debris' | 'sandbag' | 'fence' | 'door' | 'window'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  properties?: {
    team?: 'alpha' | 'bravo'
    health?: number
    isObjective?: boolean
    isBreakable?: boolean
  }
}

interface MapEditorProps {
  objects: MapObject[]
  selectedObject: string | null
  onSelectObject: (id: string | null) => void
  onUpdateObject: (id: string, updates: Partial<MapObject>) => void
  onAddObject: (object: Omit<MapObject, 'id'>) => void
  onDeleteObject: (id: string) => void
  mode: 'select' | 'add' | 'delete'
  objectType: MapObject['type']
  cameraMode: 'free' | 'fps'
  playerPosition: [number, number, number]
  onPlayerMove: (position: [number, number, number]) => void
}

export default function MapEditor({
  objects,
  selectedObject,
  onSelectObject,
  onUpdateObject,
  onAddObject,
  onDeleteObject,
  mode,
  objectType,
  cameraMode,
  playerPosition,
  onPlayerMove
}: MapEditorProps) {
  const { camera, gl, scene } = useThree()
  const transformRef = useRef<any>(null)
  const [hoveredObject, setHoveredObject] = useState<string | null>(null)
  const gridRef = useRef<any>(null)

  // Raycasting for object selection and creation
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  // Handle mouse click for selection and creation
  const handleClick = (event: MouseEvent) => {
    if (mode === 'select') return

    // Calculate mouse position
    const rect = gl.domElement.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera)

    if (mode === 'add') {
      // Find intersection with ground plane
      const intersection = new THREE.Vector3()
      raycaster.current.ray.intersectPlane(planeRef.current, intersection)

      if (intersection) {
        const newObject: Omit<MapObject, 'id'> = {
          type: objectType,
          position: [intersection.x, 0, intersection.z],
          rotation: [0, 0, 0],
          scale: getDefaultScale(objectType),
          color: getDefaultColor(objectType),
          properties: getDefaultProperties(objectType)
        }
        onAddObject(newObject)
      }
    } else if (mode === 'delete') {
      // Check for object intersection
      const allMeshes = objects.map(obj => scene.getObjectByName(obj.id)).filter(Boolean) as THREE.Mesh[]
      const intersects = raycaster.current.intersectObjects(allMeshes)

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object
        onDeleteObject(clickedObject.name)
      }
    }
  }

  // Set up click handler
  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [mode, objectType, camera])

  // Update selected object in transform controls
  useEffect(() => {
    if (transformRef.current && selectedObject) {
      const object = scene.getObjectByName(selectedObject)
      if (object) {
        transformRef.current.attach(object)
      }
    } else if (transformRef.current && !selectedObject) {
      transformRef.current.detach()
    }
  }, [selectedObject])

  // Helper functions
  const getDefaultScale = (type: MapObject['type']): [number, number, number] => {
    switch (type) {
      case 'building': return [10, 8, 10]
      case 'crate': return [2, 2, 2]
      case 'wall': return [10, 3, 0.5]
      case 'tree': return [1, 6, 1]
      case 'light': return [0.5, 8, 0.5]
      case 'spawn': return [3, 0.1, 3]
      case 'vehicle': return [4, 2, 8]
      case 'weapon': return [1, 1, 3]
      case 'barrel': return [0.8, 1.2, 0.8]
      case 'tire': return [0.6, 0.2, 0.6]
      case 'debris': return [1.5, 0.3, 1]
      case 'sandbag': return [2, 0.8, 1]
      case 'fence': return [4, 2, 0.1]
      case 'door': return [2, 3, 0.1]
      case 'window': return [1.5, 1.5, 0.1]
      default: return [1, 1, 1]
    }
  }

  const getDefaultColor = (type: MapObject['type']): string => {
    switch (type) {
      case 'building': return '#2d3748'
      case 'crate': return '#92400e'
      case 'wall': return '#6b7280'
      case 'tree': return '#16a34a'
      case 'light': return '#fbbf24'
      case 'spawn': return '#ef4444'
      case 'vehicle': return '#1f2937'
      case 'weapon': return '#374151'
      case 'barrel': return '#dc2626'
      case 'tire': return '#1f2937'
      case 'debris': return '#78716c'
      case 'sandbag': return '#92400e'
      case 'fence': return '#6b7280'
      case 'door': return '#7c2d12'
      case 'window': return '#60a5fa'
      default: return '#6b7280'
    }
  }

  const getDefaultProperties = (type: MapObject['type']): { team?: 'alpha' | 'bravo'; health?: number; isObjective?: boolean; isBreakable?: boolean } => {
    switch (type) {
      case 'spawn':
        return { team: 'alpha' as const, isObjective: false }
      case 'weapon':
        return { health: 100 }
      default:
        return {}
    }
  }

  // Render individual objects
  const renderObject = (obj: MapObject) => {
    const isSelected = selectedObject === obj.id
    const isHovered = hoveredObject === obj.id

    const handleClick = (e: any) => {
      e.stopPropagation()
      if (mode === 'select') {
        onSelectObject(obj.id)
      }
    }

    const handlePointerOver = () => {
      if (mode === 'select' || mode === 'delete') {
        setHoveredObject(obj.id)
      }
    }

    const handlePointerOut = () => {
      setHoveredObject(null)
    }

    switch (obj.type) {
      case 'building':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.7}
            />
          </mesh>
        )

      case 'crate':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.9}
            />
          </mesh>
        )

      case 'wall':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.8}
            />
          </mesh>
        )

      case 'tree':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.5, 0.7, 6]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.9} />
            </mesh>
            <mesh
              position={[0, 3, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[2.5, 8, 6]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.8}
              />
            </mesh>
          </group>
        )

      case 'light':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
            >
              <cylinderGeometry args={[0.2, 0.2, 6]} />
              <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh
              position={[0, 5.5, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[0.8]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={obj.color}
                emissiveIntensity={isSelected ? 1.2 : 0.8}
              />
            </mesh>
          </group>
        )

      case 'spawn':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              receiveShadow
            >
              <cylinderGeometry args={[1, 1, 0.1, 8]} />
              <meshStandardMaterial
                color={obj.properties?.team === 'alpha' ? '#dc2626' : '#2563eb'}
                emissive={obj.properties?.team === 'alpha' ? '#dc2626' : '#2563eb'}
                emissiveIntensity={isSelected ? 0.5 : 0.3}
              />
            </mesh>
            <mesh
              position={[0, 2, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
            >
              <coneGeometry args={[0.5, 2, 8]} />
              <meshStandardMaterial
                color={obj.properties?.team === 'alpha' ? '#dc2626' : '#2563eb'}
                emissive={obj.properties?.team === 'alpha' ? '#dc2626' : '#2563eb'}
                emissiveIntensity={isSelected ? 0.5 : 0.3}
              />
            </mesh>
          </group>
        )

      case 'vehicle':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.6}
              metalness={0.4}
            />
          </mesh>
        )

      case 'weapon':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        )

      case 'barrel':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.8, 0.6, 1.2]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.7}
                metalness={0.3}
              />
            </mesh>
            {/* Barrel stripes */}
            <mesh position={[0, 0.4, 0]} rotation={obj.rotation}>
              <torusGeometry args={[0.81, 0.05, 16]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, -0.2, 0]} rotation={obj.rotation}>
              <torusGeometry args={[0.81, 0.05, 16]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
        )

      case 'tire':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={[Math.PI / 2, obj.rotation[1] || 0, obj.rotation[2] || 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <torusGeometry args={[0.5, 0.1, 16]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.8}
              />
            </mesh>
            {/* Tire tread */}
            <mesh rotation={[Math.PI / 2, obj.rotation[1] || 0, obj.rotation[2] || 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
          </group>
        )

      case 'debris':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            {/* Broken concrete pieces */}
            <mesh
              position={[0, 0.1, 0]}
              rotation={[Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1, 0.2, 0.8]} />
              <meshStandardMaterial color={obj.color} roughness={0.9} />
            </mesh>
            <mesh
              position={[0.5, 0.05, 0.3]}
              rotation={[0.2, 0.5, 0.1]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.8, 0.1, 0.6]} />
              <meshStandardMaterial color={obj.color} roughness={0.9} />
            </mesh>
          </group>
        )

      case 'sandbag':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[2, 0.8, 1]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.9}
              />
            </mesh>
            {/* Sandbag texture lines */}
            <mesh position={[0, 0, 0.51]} rotation={obj.rotation}>
              <boxGeometry args={[2, 0.8, 0.02]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
          </group>
        )

      case 'fence':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            {/* Fence posts */}
            <mesh position={[-1.5, 1, 0]} rotation={obj.rotation} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 2]} />
              <meshStandardMaterial color={obj.color} roughness={0.8} />
            </mesh>
            <mesh position={[1.5, 1, 0]} rotation={obj.rotation} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 2]} />
              <meshStandardMaterial color={obj.color} roughness={0.8} />
            </mesh>
            {/* Fence mesh */}
            <mesh
              position={[0, 1.5, 0]}
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              receiveShadow
            >
              <boxGeometry args={[4, 2, 0.1]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.8}
              />
            </mesh>
          </group>
        )

      case 'door':
        return (
          <mesh
            key={obj.id}
            name={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
              roughness={0.7}
            />
            {/* Door handle */}
            <mesh position={[0.3, 0, 0.51]}>
              <sphereGeometry args={[0.05]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
            </mesh>
          </mesh>
        )

      case 'window':
        return (
          <group key={obj.id} name={obj.id} position={obj.position} scale={obj.scale}>
            {/* Window frame */}
            <mesh
              rotation={obj.rotation}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1.5, 1.5, 0.1]} />
              <meshStandardMaterial
                color={obj.color}
                emissive={isSelected ? '#4ade80' : isHovered ? '#60a5fa' : '#000000'}
                emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                roughness={0.6}
              />
            </mesh>
            {/* Glass */}
            <mesh position={[0, 0, 0.06]} rotation={obj.rotation}>
              <boxGeometry args={[1.3, 1.3, 0.02]} />
              <meshStandardMaterial
                color="#60a5fa"
                transparent
                opacity={0.3}
                roughness={0}
                metalness={1}
              />
            </mesh>
            {/* Window cross */}
            <mesh position={[0, 0, 0.07]} rotation={obj.rotation}>
              <boxGeometry args={[1.3, 0.05, 0.01]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.3, 0.05, 0.01]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
          </group>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Grid for reference */}
      <Grid
        ref={gridRef}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Ground plane for raycasting */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        visible={false}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Render all objects */}
      {objects.map(renderObject)}

      {/* Transform controls for selected object */}
      {selectedObject && (
        <TransformControls
          ref={transformRef}
          mode="translate"
          onObjectChange={() => {
            if (transformRef.current && transformRef.current.object) {
              const obj = transformRef.current.object
              const position = obj.position.toArray() as [number, number, number]
              const rotation = obj.rotation.toArray().slice(0, 3) as [number, number, number]
              const scale = obj.scale.toArray() as [number, number, number]

              onUpdateObject(selectedObject, { position, rotation, scale })
            }
          }}
        />
      )}

      {/* Camera controls (only when not in transform mode) */}
      <OrbitControls
        enabled={!selectedObject}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* Visual feedback for current mode */}
      {mode === 'add' && (
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.5} />
        </mesh>
      )}

      {mode === 'delete' && (
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
        </mesh>
      )}
    </>
  )
}