// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, BoxGeometry, PlaneGeometry, CylinderGeometry, SphereGeometry, Vector3 } from 'three'
import { MeshStandardMaterial, MeshLambertMaterial } from 'three'

// Tactical Environment Props
interface TacticalEnvironmentProps {
  environmentType?: 'urban' | 'desert' | 'forest' | 'snow'
}

const TacticalEnvironment: React.FC<TacticalEnvironmentProps> = ({
  environmentType = 'urban'
}) => {
  const groupRef = useRef<Mesh>(null)

  useFrame((state) => {
    // Subtle environment animation
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.005
    }
  })

  const environmentElements = useMemo(() => {
    const elements = []

    switch (environmentType) {
      case 'urban':
        return <UrbanCombatZone />
      case 'desert':
        return <DesertCombatZone />
      case 'forest':
        return <ForestCombatZone />
      case 'snow':
        return <SnowCombatZone />
      default:
        return <UrbanCombatZone />
    }
  }, [environmentType])

  return (
    <group ref={groupRef}>
      {environmentElements}
    </group>
  )
}

// Urban Combat Zone
const UrbanCombatZone: React.FC = () => {
  return (
    <group>
      {/* Ground - Concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20, 10, 10]} />
        <meshStandardMaterial color="#6a6a6a" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Concrete barriers */}
      <mesh position={[-3, 0.3, -2]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.6, 0.4]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[3, 0.3, -2]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.6, 0.4]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Destroyed building walls */}
      <mesh position={[-5, 1.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 3, 4]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[5, 1.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 3, 4]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Rubble and debris */}
      {[[-2, 0.1, -1], [1, 0.15, -0.5], [0, 0.08, -1.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.2, 0.4]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}

      {/* Sandbags */}
      {[
        [-1.5, 0.15, 0.5], [-0.5, 0.15, 0.5], [0.5, 0.15, 0.5], [1.5, 0.15, 0.5],
        [-1.5, 0.3, 0.5], [-0.5, 0.3, 0.5], [0.5, 0.3, 0.5], [1.5, 0.3, 0.5]
      ].map((pos, i) => (
        <mesh key={`sandbag-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.3]} />
          <meshStandardMaterial color="#8a6a3a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Barbed wire */}
      <mesh position={[0, 0.5, 2]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 4, 8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Oil drum */}
      <mesh position={[-3, 0.4, 1]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 16]} />
        <meshStandardMaterial color="#2a2a1a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Pallets */}
      <mesh position={[2, 0.1, 1]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Crates */}
      <mesh position={[2.5, 0.25, 1.5]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[2, 0.35, 1.5]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}

// Desert Combat Zone
const DesertCombatZone: React.FC = () => {
  return (
    <group>
      {/* Sandy ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20, 10, 10]} />
        <meshStandardMaterial color="#c4a574" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Sand dunes */}
      <mesh position={[-3, 0.5, -2]} castShadow receiveShadow>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color="#d4b574" roughness={1.0} metalness={0.0} />
      </mesh>
      <mesh position={[4, 0.8, -3]} castShadow receiveShadow>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshStandardMaterial color="#c4a574" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Rock formations */}
      <mesh position={[-2, 0.6, 1]} castShadow receiveShadow>
        <boxGeometry args={[1, 1.2, 0.8]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[3, 0.8, 2]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.6, 1]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Desert vegetation */}
      {[
        [-1, 0.2, -0.5], [0.5, 0.15, 0.8], [-2.5, 0.25, -1.5], [1.5, 0.18, -2]
      ].map((pos, i) => (
        <mesh key={`cactus-${i}`} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.4, 8]} />
          <meshStandardMaterial color="#5a6a4a" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}

      {/* Desert fox holes */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 16]} />
        <meshStandardMaterial color="#a48554" roughness={1.0} metalness={0.0} />
      </mesh>
    </group>
  )
}

// Forest Combat Zone
const ForestCombatZone: React.FC = () => {
  return (
    <group>
      {/* Forest floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20, 10, 10]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Trees */}
      {[
        { pos: [-3, 1, -2], trunkRadius: 0.15, trunkHeight: 2, foliageRadius: 0.8 },
        { pos: [4, 1.5, -3], trunkRadius: 0.2, trunkHeight: 3, foliageRadius: 1.2 },
        { pos: [-2, 0.8, 2], trunkRadius: 0.12, trunkHeight: 1.6, foliageRadius: 0.6 },
        { pos: [3, 1.2, 1], trunkRadius: 0.18, trunkHeight: 2.4, foliageRadius: 1 }
      ].map((tree, i) => (
        <group key={`tree-${i}`} position={tree.pos as [number, number, number]}>
          {/* Tree trunk */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[tree.trunkRadius, tree.trunkRadius * 1.5, tree.trunkHeight, 12]} />
            <meshStandardMaterial color="#5a3a2a" roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Tree foliage */}
          <mesh position={[0, tree.trunkHeight / 2, 0]} castShadow>
            <sphereGeometry args={[tree.foliageRadius, 12, 12]} />
            <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
          </mesh>
        </group>
      ))}

      {/* Logs */}
      <mesh position={[-1, 0.15, 0.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 2, 12]} />
        <meshStandardMaterial color="#6a4a3a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Fallen leaves */}
      {[[-0.5, 0.02, -1], [1, 0.01, 0.5], [-2, 0.015, 1.5]].map((pos, i) => (
        <mesh key={`leaves-${i}`} position={pos as [number, number, number]} receiveShadow>
          <boxGeometry args={[0.3, 0.01, 0.4]} />
          <meshStandardMaterial color="#7a6a4a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Bushes */}
      {[
        [-2.5, 0.4, -0.5], [1.5, 0.35, -1.5], [0, 0.3, 2], [2, 0.45, 0.5]
      ].map((pos, i) => (
        <mesh key={`bush-${i}`} position={pos as [number, number, number]} castShadow>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial color="#5a7a5a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}
    </group>
  )
}

// Snow Combat Zone
const SnowCombatZone: React.FC = () => {
  return (
    <group>
      {/* Snowy ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20, 10, 10]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Snow drifts */}
      <mesh position={[-2, 0.3, -1]} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[3, 0.4, -2]} castShadow receiveShadow>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Ice walls */}
      <mesh position={[-4, 1, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 2, 3]} />
        <meshStandardMaterial color="#e0f0ff" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[4, 1.2, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 2.4, 3]} />
        <meshStandardMaterial color="#d0e8ff" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Snow-covered rocks */}
      <mesh position={[0, 0.6, 1]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[-1, 0.4, -2]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.8, 0.5]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Snow walls for cover */}
      <mesh position={[0, 0.3, 2]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.6, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Frozen trees */}
      {[
        { pos: [-3, 1, 0.5], trunkRadius: 0.12, trunkHeight: 2 },
        { pos: [2, 1.3, -1.5], trunkRadius: 0.15, trunkHeight: 2.6 }
      ].map((tree, i) => (
        <group key={`frozen-tree-${i}`} position={tree.pos as [number, number, number]}>
          {/* Icy trunk */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[tree.trunkRadius, tree.trunkRadius * 1.3, tree.trunkHeight, 12]} />
            <meshStandardMaterial color="#b0c0d0" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Snow-covered branches */}
          <mesh position={[0, tree.trunkHeight / 2, 0]} castShadow>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.0} />
          </mesh>
        </group>
      ))}

      {/* Ice formations */}
      <mesh position={[1, 0.2, 0.5]} castShadow>
        <coneGeometry args={[0.2, 0.4, 6]} />
        <meshStandardMaterial color="#d0e8ff" roughness={0.1} metalness={0.5} />
      </mesh>
      <mesh position={[-1.5, 0.15, 1]} castShadow>
        <coneGeometry args={[0.15, 0.3, 6]} />
        <meshStandardMaterial color="#c8e0f0" roughness={0.1} metalness={0.5} />
      </mesh>
    </group>
  )
}

export { TacticalEnvironment, UrbanCombatZone, DesertCombatZone, ForestCombatZone, SnowCombatZone }