// @ts-nocheck
'use client'

import React, { useRef } from 'react'
import { Mesh } from 'three'

export default function FPSSimpleMap() {
  const groundRef = useRef<Mesh>(null)

  return (
    <group>
      {/* Ground/Fl terrain */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a5568" roughness={0.8} />
      </mesh>

      {/* Central Building (2-story) */}
      <group position={[0, 4, 0]}>
        {/* Building Base */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 8, 12]} />
          <meshStandardMaterial color="#2d3748" roughness={0.7} />
        </mesh>

        {/* Windows */}
        {[[-5, 2, 6], [0, 2, 6], [5, 2, 6], [-5, 2, -6], [0, 2, -6], [5, 2, -6]].map((pos, i) => (
          <mesh key={`window1-${i}`} position={pos as [number, number, number]}>
            <boxGeometry args={[1.5, 2, 0.2]} />
            <meshStandardMaterial color="#60a5fa" emissive="#1e40af" emissiveIntensity={0.2} />
          </mesh>
        ))}

        {/* Second Floor Windows */}
        {[[-5, 5, 6], [0, 5, 6], [5, 5, 6], [-5, 5, -6], [0, 5, -6], [5, 5, -6]].map((pos, i) => (
          <mesh key={`window2-${i}`} position={pos as [number, number, number]}>
            <boxGeometry args={[1.5, 2, 0.2]} />
            <meshStandardMaterial color="#60a5fa" emissive="#1e40af" emissiveIntensity={0.2} />
          </mesh>
        ))}

        {/* Roof */}
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[13, 0.5, 13]} />
          <meshStandardMaterial color="#1a202c" roughness={0.6} />
        </mesh>
      </group>

      {/* Corner Building 1 - North East */}
      <group position={[25, 3, 25]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 6, 8]} />
          <meshStandardMaterial color="#4a5568" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[9, 0.5, 9]} />
          <meshStandardMaterial color="#2d3748" roughness={0.6} />
        </mesh>
      </group>

      {/* Corner Building 2 - South West */}
      <group position={[-25, 3, -25]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 6, 10]} />
          <meshStandardMaterial color="#4a5568" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[11, 0.5, 11]} />
          <meshStandardMaterial color="#2d3748" roughness={0.6} />
        </mesh>
      </group>

      {/* Long Building - East Side */}
      <group position={[35, 2.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 5, 20]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
        {/* Door */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 3, 0.3]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>

      {/* Long Building - West Side */}
      <group position={[-35, 2.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 5, 20]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
        {/* Windows along the side */}
        {[[-7, 1, 3], [-7, 1, 0], [-7, 1, -3]].map((pos, i) => (
          <mesh key={`west-window-${i}`} position={pos as [number, number, number]}>
            <boxGeometry args={[0.3, 1.5, 2]} />
            <meshStandardMaterial color="#60a5fa" emissive="#1e40af" emissiveIntensity={0.1} />
          </mesh>
        ))}
      </group>

      {/* Cover/Crates - Scattered around */}
      {[
        [10, 1, 10], [-10, 1, -10], [15, 1, -15], [-15, 1, 15],
        [5, 1, -5], [-5, 1, 5], [20, 1, 0], [-20, 1, 0],
        [0, 1, 20], [0, 1, -20], [12, 1, -8], [-12, 1, 8]
      ].map((pos, i) => (
        <group key={`crate-${i}`} position={pos as [number, number, number]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>
          {/* Crate details */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.8, 0.1, 1.8]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      ))}

      {/* Low Walls for cover */}
      <group position={[0, 0.5, -15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[15, 1, 0.5]} />
          <meshStandardMaterial color="#6b7280" roughness={0.8} />
        </mesh>
      </group>

      <group position={[0, 0.5, 15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[15, 1, 0.5]} />
          <meshStandardMaterial color="#6b7280" roughness={0.8} />
        </mesh>
      </group>

      <group position={[-15, 0.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 1, 15]} />
          <meshStandardMaterial color="#6b7280" roughness={0.8} />
        </mesh>
      </group>

      <group position={[15, 0.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 1, 15]} />
          <meshStandardMaterial color="#6b7280" roughness={0.8} />
        </mesh>
      </group>

      {/* Spawn Points - Alpha Team (Red) */}
      <group position={[-40, 0.1, -40]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3, 3, 0.1, 8]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <coneGeometry args={[1, 3, 8]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Spawn Points - Bravo Team (Blue) */}
      <group position={[40, 0.1, 40]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3, 3, 0.1, 8]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <coneGeometry args={[1, 3, 8]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Capture Point - Central Objective */}
      <group position={[0, 0.1, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[5, 5, 0.1, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
        </mesh>
        {/* Rotating flag indicator */}
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 8]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[2, 6, 0]}>
          <boxGeometry args={[4, 3, 0.1]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Street Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[6, 100]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[6, 100]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>

      {/* Street Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[0.3, 100]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.06, 0]}>
        <planeGeometry args={[0.3, 100]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.1} />
      </mesh>

      {/* Decorative Elements - Trees */}
      {[
        [-20, 3, 30], [30, 3, -20], [-30, 3, -30], [25, 3, 35],
        [18, 2.5, -35], [-35, 2.5, 18], [35, 2.5, -10], [-10, 2.5, 35]
      ].map((pos, i) => (
        <group key={`tree-${i}`} position={pos as [number, number, number]}>
          {/* Tree trunk */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.7, 6]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.9} />
          </mesh>
          {/* Tree foliage */}
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <sphereGeometry args={[2.5, 8, 6]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Lighting Poles */}
      {[
        [20, 3, 20], [-20, 3, 20], [20, 3, -20], [-20, 3, -20],
        [35, 3, 0], [-35, 3, 0], [0, 3, 35], [0, 3, -35]
      ].map((pos, i) => (
        <group key={`pole-${i}`} position={pos as [number, number, number]}>
          {/* Pole */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 6]} />
            <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Light */}
          <mesh position={[0, 5.5, 0]}>
            <sphereGeometry args={[0.8]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Barbed Wire Fences */}
      {[
        { start: [-25, 1, 30], end: [25, 1, 30] },
        { start: [-25, 1, -30], end: [25, 1, -30] },
        { start: [30, 1, -25], end: [30, 1, 25] },
        { start: [-30, 1, -25], end: [-30, 1, 25] }
      ].map((fence, i) => (
        <group key={`fence-${i}`}>
          {/* Fence posts */}
          <mesh position={fence.start as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={fence.end as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Barbed wire */}
          <mesh position={[
            (fence.start[0] + fence.end[0]) / 2,
            fence.start[1] + 0.8,
            (fence.start[2] + fence.end[2]) / 2
          ]}>
            <boxGeometry args={[
              Math.abs(fence.end[0] - fence.start[0]) + 0.5,
              0.1,
              Math.abs(fence.end[2] - fence.start[2]) + 0.5
            ]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}