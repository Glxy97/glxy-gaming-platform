// @ts-nocheck
'use client'

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, RingGeometry, Vector3 } from 'three'
import { MeshStandardMaterial, MeshLambertMaterial } from 'three'
import { Text } from '@react-three/drei'
import { HumanAnatomy, MilitaryEquipment, WeaponSystems } from './MilitaryHumanModels'

// Enhanced Operator with animations and interactions
interface EnhancedOperatorProps {
  position?: [number, number, number]
  rotation?: number
  isAnimating?: boolean
  onHover?: (hovered: boolean) => void
  onClick?: () => void
  operatorName: string
}

export const EnhancedAssaultOperator: React.FC<EnhancedOperatorProps> = ({
  position = [0, 0, 0],
  rotation = 0,
  isAnimating = true,
  onHover,
  onClick,
  operatorName
}) => {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const anatomy = useMemo(() => new HumanAnatomy([0, 0, 0], 1.0, 'male', 'athletic'), [])
  const equipment = useMemo(() => new MilitaryEquipment(), [])
  const weapons = useMemo(() => new WeaponSystems(), [])

  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      // Combat-ready stance animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.02
      groupRef.current.rotation.y = rotation + Math.sin(state.clock.elapsedTime * 0.5) * 0.05

      // Weapon ready position
      if (hovered) {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.02
      }
    }
  })

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => {
        setHovered(true)
        onHover?.(true)
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover?.(false)
      }}
      onClick={onClick}
    >
      {/* Operator Name Label */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.15}
        color={hovered ? '#ffaa00' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {operatorName}
      </Text>

      {/* Glow effect when hovered */}
      {hovered && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.1} />
        </mesh>
      )}

      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#d4a574')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Enhanced tactical helmet with communications */}
      {(() => {
        const tempGroup = new Group()
        equipment.createTacticalHelmet(tempGroup, [0, 1.65, 0], '#2a4d3a')

        // Add communications antenna
        const antennaGeometry = new CylinderGeometry(0.005, 0.005, 0.2, 8)
        const antenna = new Mesh(antennaGeometry, new MeshStandardMaterial({
          color: '#1a1a1a',
          roughness: 0.3,
          metalness: 0.8
        }))
        antenna.position.set(0, 1.78, 0.12)
        tempGroup.add(antenna)

        // Add tactical light
        const lightGeometry = new BoxGeometry(0.03, 0.02, 0.04)
        const tacticalLight = new Mesh(lightGeometry, new MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.2,
          metalness: 0.9,
          emissive: '#ffffff',
          emissiveIntensity: hovered ? 0.5 : 0.1
        }))
        tacticalLight.position.set(0, 1.62, 0.13)
        tempGroup.add(tacticalLight)

        return tempGroup.children.map((child, index) => (
          <primitive key={`helmet-${index}`} object={child} />
        ))
      })()}

      {/* Enhanced tactical vest with more pouches */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.36, 0.42, 0.16]} />
        <meshStandardMaterial color="#3a5a3a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Additional MOLLE pouches */}
      {[[-0.14, 1.25, 0.09], [0.14, 1.25, 0.09], [-0.14, 1.35, 0.09], [0.14, 1.35, 0.09]].map((pos, i) => (
        <mesh key={`pouch-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.045, 0.06, 0.025]} />
          <meshStandardMaterial color="#2a4a3a" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* Enhanced combat pants with knee protection */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 0.19]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Combat boots with enhanced details */}
      {(() => {
        const tempGroup = new Group()
        equipment.createCombatBoots(
          tempGroup,
          [-0.08, -0.05, 0.08],
          [0.08, -0.05, 0.08]
        )

        // Add boot details
        const leftToeGuard = new Mesh(
          new BoxGeometry(0.08, 0.02, 0.04),
          new MeshStandardMaterial({
            color: '#1a1a1a',
            roughness: 0.6,
            metalness: 0.3
          })
        )
        leftToeGuard.position.set(-0.08, -0.06, 0.12)
        tempGroup.add(leftToeGuard)

        const rightToeGuard = new Mesh(
          new BoxGeometry(0.08, 0.02, 0.04),
          new MeshStandardMaterial({
            color: '#1a1a1a',
            roughness: 0.6,
            metalness: 0.3
          })
        )
        rightToeGuard.position.set(0.08, -0.06, 0.12)
        tempGroup.add(rightToeGuard)

        return tempGroup.children.map((child, index) => (
          <primitive key={`boot-${index}`} object={child} />
        ))
      })()}

      {/* Enhanced tactical gloves */}
      {(() => {
        const tempGroup = new Group()
        equipment.createTacticalGloves(
          tempGroup,
          [-0.28, 1.2, 0],
          [0.28, 1.2, 0]
        )

        // Add grip details
        const leftGripTexture = new Mesh(
          new BoxGeometry(0.036, 0.07, 0.036),
          new MeshStandardMaterial({
            color: '#4a2a1a',
            roughness: 0.8,
            metalness: 0.1
          })
        )
        leftGripTexture.position.set(-0.28, 1.2, 0)
        tempGroup.add(leftGripTexture)

        const rightGripTexture = new Mesh(
          new BoxGeometry(0.036, 0.07, 0.036),
          new MeshStandardMaterial({
            color: '#4a2a1a',
            roughness: 0.8,
            metalness: 0.1
          })
        )
        rightGripTexture.position.set(0.28, 1.2, 0)
        tempGroup.add(rightGripTexture)

        return tempGroup.children.map((child, index) => (
          <primitive key={`glove-${index}`} object={child} />
        ))
      })()}

      {/* Enhanced M4A1 with attachments */}
      {(() => {
        const tempGroup = new Group()
        weapons.createM4A1(tempGroup, [0.35, 1.2, 0.15])

        // Add foregrip
        const foregripGeometry = new BoxGeometry(0.02, 0.08, 0.03)
        const foregrip = new Mesh(foregripGeometry, new MeshStandardMaterial({
          color: '#1a1a1a',
          roughness: 0.7,
          metalness: 0.2
        }))
        foregrip.position.set(0.35, 1.15, 0.12)
        tempGroup.add(foregrip)

        // Add tactical flashlight
        const flashlightGeometry = new CylinderGeometry(0.015, 0.015, 0.06, 8)
        const flashlight = new Mesh(flashlightGeometry, new MeshStandardMaterial({
          color: '#1a1a1a',
          roughness: 0.3,
          metalness: 0.7,
          emissive: '#ffffff',
          emissiveIntensity: hovered ? 0.3 : 0.05
        }))
        flashlight.position.set(0.32, 1.18, 0.08)
        flashlight.rotation.x = Math.PI / 2
        tempGroup.add(flashlight)

        // Add laser sight
        const laserGeometry = new BoxGeometry(0.01, 0.03, 0.015)
        const laser = new Mesh(laserGeometry, new MeshStandardMaterial({
          color: '#ff0000',
          roughness: 0.2,
          metalness: 0.8,
          emissive: '#ff0000',
          emissiveIntensity: hovered ? 0.5 : 0.1
        }))
        laser.position.set(0.38, 1.18, 0.08)
        tempGroup.add(laser)

        return tempGroup.children.map((child, index) => (
          <primitive key={`weapon-${index}`} object={child} />
        ))
      })()}

      {/* Enhanced sidearm with holster */}
      <group position={[0.25, 1.0, 0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.035, 0.09, 0.025]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]} castShadow>
          <boxGeometry args={[0.04, 0.06, 0.03]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>

      {/* Enhanced knee pads with articulation */}
      <group position={[-0.1, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.05, 0.09]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
      <group position={[0.1, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.05, 0.09]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>

      {/* Enhanced radio with antenna */}
      <group position={[0.15, 1.35, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.045, 0.09, 0.025]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.02, 0.013]}>
          <boxGeometry args={[0.03, 0.02, 0.001]} />
          <meshStandardMaterial color="#00ff00" roughness={0.1} metalness={0.1} emissive="#00ff00" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Enhanced grenades with rings */}
      {[
        { pos: [-0.12, 1.25, 0.08], color: '#ff4444', type: 'frag' },
        { pos: [-0.12, 1.35, 0.08], color: '#44ff44', type: 'smoke' },
        { pos: [-0.12, 1.45, 0.08], color: '#ffff44', type: 'flash' }
      ].map((grenade, i) => (
        <group key={`grenade-${i}`} position={grenade.pos as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.065, 12]} />
            <meshStandardMaterial color={grenade.color} roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <ringGeometry args={[0.025, 0.035, 8]} />
            <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Night vision goggles (when hovered) */}
      {hovered && (
        <group position={[0, 1.7, 0.12]}>
          <mesh>
            <boxGeometry args={[0.12, 0.04, 0.06]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[-0.03, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
            <meshStandardMaterial color="#2a4a8a" roughness={0.2} metalness={0.8} emissive="#2a4a8a" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.03, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
            <meshStandardMaterial color="#2a4a8a" roughness={0.2} metalness={0.8} emissive="#2a4a8a" emissiveIntensity={0.2} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// Enhanced Recon Specialist with more detailed ghillie suit
export const EnhancedReconSpecialist: React.FC<EnhancedOperatorProps> = ({
  position = [0, 0, 0],
  rotation = 0,
  isAnimating = true,
  onHover,
  onClick,
  operatorName
}) => {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const anatomy = useMemo(() => new HumanAnatomy([0, 0, 0], 1.0, 'male', 'athletic'), [])
  const equipment = useMemo(() => new MilitaryEquipment(), [])
  const weapons = useMemo(() => new WeaponSystems(), [])

  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      // Sniper remains very still
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.005
      groupRef.current.rotation.y = rotation

      // Occasional scope adjustment
      if (hovered) {
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.01
      }
    }
  })

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => {
        setHovered(true)
        onHover?.(true)
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover?.(false)
      }}
      onClick={onClick}
    >
      {/* Operator Name Label */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.15}
        color={hovered ? '#00ff00' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {operatorName}
      </Text>

      {/* Enhanced ghillie suit with detailed camouflage */}
      <group>
        {/* Base ghillie suit */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.42, 0.35, 0.38]} />
          <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
        </mesh>

        {/* Layered camouflage strips */}
        {[
          [-0.2, 1.5, 0, '#5a7a5a'], [0.2, 1.5, 0, '#3a5a3a'],
          [-0.15, 1.4, 0.1, '#6a8a6a'], [0.15, 1.4, 0.1, '#4a6a4a'],
          [-0.18, 1.6, -0.1, '#3a4a3a'], [0.18, 1.6, -0.1, '#5a6a5a'],
          [0, 1.45, 0.15, '#4a5a4a'], [0, 1.55, -0.15, '#3a4a3a']
        ].map((pos, i) => (
          <mesh key={`ghillie-${i}`} position={pos.slice(0, 3) as [number, number, number]} castShadow>
            <boxGeometry args={[0.1, 0.18, 0.1]} />
            <meshStandardMaterial color={pos[3] as string} roughness={1.0} metalness={0.0} />
          </mesh>
        ))}

        {/* Enhanced ghillie hood */}
        <mesh position={[0, 1.75, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#5a7a5a" roughness={1.0} metalness={0.0} />
        </mesh>

        {/* Ghillie veil */}
        <mesh position={[0, 1.8, 0.05]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.02]} />
          <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Enhanced camouflage pants with detailed strips */}
      <group>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.32, 0.55, 0.28]} />
          <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
        </mesh>

        {/* Camouflage strips on legs */}
        {[
          [-0.12, 0.4, 0.1, '#5a7a5a'], [0.12, 0.4, 0.1, '#3a5a3a'],
          [-0.1, 0.2, 0.15, '#6a8a6a'], [0.1, 0.2, 0.15, '#4a6a4a'],
          [-0.08, 0.5, -0.1, '#3a4a3a'], [0.08, 0.5, -0.1, '#5a6a5a']
        ].map((pos, i) => (
          <mesh key={`leg-camo-${i}`} position={pos.slice(0, 3) as [number, number, number]} castShadow>
            <boxGeometry args={[0.12, 0.25, 0.12]} />
            <meshStandardMaterial color={pos[3] as string} roughness={1.0} metalness={0.0} />
          </mesh>
        ))}
      </group>

      {/* Ghillie gloves */}
      <mesh position={[-0.32, 1.15, 0]} castShadow>
        <boxGeometry args={[0.045, 0.09, 0.045]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>
      <mesh position={[0.32, 1.15, 0]} castShadow>
        <boxGeometry args={[0.045, 0.09, 0.045]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Ghillie boots */}
      <mesh position={[-0.08, -0.05, 0.08]} castShadow>
        <boxGeometry args={[0.08, 0.13, 0.22]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>
      <mesh position={[0.08, -0.05, 0.08]} castShadow>
        <boxGeometry args={[0.08, 0.13, 0.22]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Enhanced sniper rifle with detailed scope */}
      {(() => {
        const tempGroup = new Group()
        weapons.createSniperRifle(tempGroup, [0.4, 1.1, 0.1], false)

        // Add scope cover
        const scopeCoverGeometry = new BoxGeometry(0.025, 0.22, 0.025)
        const scopeCover = new Mesh(scopeCoverGeometry, new MeshStandardMaterial({
          color: '#2a2a2a',
          roughness: 0.4,
          metalness: 0.6
        }))
        scopeCover.position.set(0.4, 1.1, 0.1)
        tempGroup.add(scopeCover)

        // Add cheek rest
        const cheekRestGeometry = new BoxGeometry(0.03, 0.06, 0.04)
        const cheekRest = new Mesh(cheekRestGeometry, new MeshStandardMaterial({
          color: '#3a2a1a',
          roughness: 0.8,
          metalness: 0.1
        }))
        cheekRest.position.set(0.25, 1.15, 0.08)
        tempGroup.add(cheekRest)

        return tempGroup.children.map((child, index) => (
          <primitive key={`sniper-${index}`} object={child} />
        ))
      })()}

      {/* Enhanced spotting scope */}
      <group position={[0.1, 1.2, -0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* Enhanced binoculars */}
      <group position={[0, 1.45, 0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.04, 0.04]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[-0.03, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.03, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Ghillie face veil (when hovered) */}
      {hovered && (
        <mesh position={[0, 1.65, 0.08]}>
          <boxGeometry args={[0.15, 0.12, 0.01]} />
          <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

// Individual exports already provided above