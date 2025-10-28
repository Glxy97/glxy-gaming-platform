// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry } from 'three'
import { MeshStandardMaterial } from 'three'
import { HumanAnatomy, MilitaryEquipment, WeaponSystems } from './MilitaryHumanModels'

// ASSAULT OPERATOR - Point Man
export const AssaultOperator: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<Group>(null)
  const anatomy = useMemo(() => new HumanAnatomy(position, 1.0, 'male', 'athletic'), [position])
  const equipment = useMemo(() => new MilitaryEquipment(), [])
  const weapons = useMemo(() => new WeaponSystems(), [])

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#d4a574')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Tactical helmet */}
      {(() => {
        const tempGroup = new Group()
        const helmetPos: [number, number, number] = [0, 1.65, 0]
        equipment.createTacticalHelmet(tempGroup, helmetPos, '#2a4d3a')
        return tempGroup.children.map((child, index) => (
          <primitive key={`helmet-${index}`} object={child} />
        ))
      })()}

      {/* Tactical vest */}
      {(() => {
        const tempGroup = new Group()
        const vestPos: [number, number, number] = [0, 1.3, 0]
        equipment.createTacticalVest(tempGroup, vestPos, '#3a5a3a')
        return tempGroup.children.map((child, index) => (
          <primitive key={`vest-${index}`} object={child} />
        ))
      })()}

      {/* Combat pants */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.6, 0.18]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Combat boots */}
      {(() => {
        const tempGroup = new Group()
        equipment.createCombatBoots(
          tempGroup,
          [-0.08, -0.05, 0.08],
          [0.08, -0.05, 0.08]
        )
        return tempGroup.children.map((child, index) => (
          <primitive key={`boot-${index}`} object={child} />
        ))
      })()}

      {/* Tactical gloves */}
      {(() => {
        const tempGroup = new Group()
        equipment.createTacticalGloves(
          tempGroup,
          [-0.28, 1.2, 0],
          [0.28, 1.2, 0]
        )
        return tempGroup.children.map((child, index) => (
          <primitive key={`glove-${index}`} object={child} />
        ))
      })()}

      {/* M4A1 Carbine */}
      {(() => {
        const tempGroup = new Group()
        weapons.createM4A1(tempGroup, [0.35, 1.2, 0.15])
        return tempGroup.children.map((child, index) => (
          <primitive key={`weapon-${index}`} object={child} />
        ))
      })()}

      {/* Sidearm (pistol) */}
      <mesh position={[0.25, 1.1, 0.2]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Tactical knee pads */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Radio on vest */}
      <mesh position={[0.15, 1.35, 0.08]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Grenades on vest */}
      <mesh position={[-0.12, 1.25, 0.08]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-0.12, 1.35, 0.08]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
        <meshStandardMaterial color="#2a4a3a" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  )
}

// RECON SPECIALIST - Sniper with Ghillie Suit
export const ReconSpecialist: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<Group>(null)
  const anatomy = useMemo(() => new HumanAnatomy(position, 1.0, 'male', 'athletic'), [position])
  const equipment = useMemo(() => new MilitaryEquipment(), [])
  const weapons = useMemo(() => new WeaponSystems(), [])

  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle breathing - sniper stays still
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.01
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#c4a574')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Ghillie suit elements */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.35]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Ghillie hood with camouflage */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Ghillie camouflage strips on shoulders */}
      {[[-0.2, 1.5, 0], [0.2, 1.5, 0], [-0.15, 1.4, 0.1], [0.15, 1.4, 0.1]].map((pos, i) => (
        <mesh key={`ghillie-${i}`} position={[pos[0], pos[1], pos[2]]} castShadow>
          <boxGeometry args={[0.08, 0.15, 0.08]} />
          <meshStandardMaterial color="#5a7a5a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Ghillie pants */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.25]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Ghillie camouflage on legs */}
      {[[-0.12, 0.4, 0.1], [0.12, 0.4, 0.1], [-0.1, 0.2, 0.15], [0.1, 0.2, 0.15]].map((pos, i) => (
        <mesh key={`leg-camo-${i}`} position={[pos[0], pos[1], pos[2]]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="#5a7a5a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Camouflaged helmet with netting */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#3a5a3a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Sniper rifle */}
      {(() => {
        const tempGroup = new Group()
        weapons.createSniperRifle(tempGroup, [0.4, 1.1, 0.1], false)
        return tempGroup.children.map((child, index) => (
          <primitive key={`sniper-${index}`} object={child} />
        ))
      })()}

      {/* Ghillie gloves */}
      <mesh position={[-0.32, 1.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>
      <mesh position={[0.32, 1.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#4a6a4a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Ghillie boots */}
      <mesh position={[-0.08, -0.05, 0.08]} castShadow>
        <boxGeometry args={[0.07, 0.12, 0.2]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>
      <mesh position={[0.08, -0.05, 0.08]} castShadow>
        <boxGeometry args={[0.07, 0.12, 0.2]} />
        <meshStandardMaterial color="#3a5a3a" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Binoculars around neck */}
      <mesh position={[0, 1.45, 0.12]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Spotting scope on back */}
      <mesh position={[0.1, 1.2, -0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}

// MARKSMAN OPERATOR - Heavy Sniper
export const MarksmanOperator: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<Group>(null)
  const anatomy = useMemo(() => new HumanAnatomy(position, 1.0, 'male', 'heavy'), [position])
  const equipment = useMemo(() => new MilitaryEquipment(), [])
  const weapons = useMemo(() => new WeaponSystems(), [])

  useFrame((state) => {
    if (groupRef.current) {
      // Stable shooting stance
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#b4a574')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Heavy tactical helmet */}
      {(() => {
        const tempGroup = new Group()
        equipment.createTacticalHelmet(tempGroup, [0, 1.68, 0], '#1a2a1a')
        return tempGroup.children.map((child, index) => (
          <primitive key={`helmet-${index}`} object={child} />
        ))
      })()}

      {/* Heavy armor vest */}
      {(() => {
        const tempGroup = new Group()
        const vestPos: [number, number, number] = [0, 1.3, 0]
        equipment.createTacticalVest(tempGroup, vestPos, '#2a2a2a')
        return tempGroup.children.map((child, index) => (
          <primitive key={`vest-${index}`} object={child} />
        ))
      })()}

      {/* Camouflage uniform */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.28, 0.5, 0.2]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Heavy combat boots */}
      {(() => {
        const tempGroup = new Group()
        equipment.createCombatBoots(
          tempGroup,
          [-0.09, -0.05, 0.08],
          [0.09, -0.05, 0.08]
        )
        return tempGroup.children.map((child, index) => (
          <primitive key={`boot-${index}`} object={child} />
        ))
      })()}

      {/* Heavy sniper rifle with bipod */}
      {(() => {
        const tempGroup = new Group()
        weapons.createSniperRifle(tempGroup, [0.4, 1.0, 0.15], true)
        return tempGroup.children.map((child, index) => (
          <primitive key={`heavy-sniper-${index}`} object={child} />
        ))
      })()}

      {/* Shooting gloves */}
      <mesh position={[-0.3, 1.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0.32, 1.1, 0]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Range finder */}
      <mesh position={[0.15, 1.35, 0.08]} castShadow>
        <boxGeometry args={[0.03, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Extra ammunition pouches */}
      <mesh position={[-0.15, 1.3, 0.08]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Shooting mat rolled up */}
      <mesh position={[0, 1.2, -0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Knee pads for prone shooting */}
      <mesh position={[-0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.2} />
      </mesh>
    </group>
  )
}

// COMBAT ENGINEER
export const CombatEngineer: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<Group>(null)
  const anatomy = useMemo(() => new HumanAnatomy(position, 1.0, 'male', 'heavy'), [position])
  const equipment = useMemo(() => new MilitaryEquipment(), [])

  useFrame((state) => {
    if (groupRef.current) {
      // Working stance movement
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.015
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#d4b574')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Hard hat */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.08, 16]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Headlamp */}
      <mesh position={[0, 1.6, 0.13]} castShadow>
        <boxGeometry args={[0.04, 0.02, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Tool belt */}
      <mesh position={[0, 0.95, 0.12]} castShadow>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Tools on belt */}
      <mesh position={[-0.15, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.02, 0.1, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.03]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Explosives pouch */}
      <mesh position={[0, 1.1, 0.1]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Demolition charges */}
      <mesh position={[-0.08, 1.08, 0.12]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.08, 1.08, 0.12]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Heavy work vest */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.32, 0.4, 0.15]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Work gloves */}
      <mesh position={[-0.3, 1.2, 0]} castShadow>
        <boxGeometry args={[0.045, 0.09, 0.045]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0.3, 1.2, 0]} castShadow>
        <boxGeometry args={[0.045, 0.09, 0.045]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Combat boots */}
      {(() => {
        const tempGroup = new Group()
        equipment.createCombatBoots(
          tempGroup,
          [-0.09, -0.05, 0.08],
          [0.09, -0.05, 0.08]
        )
        return tempGroup.children.map((child, index) => (
          <primitive key={`boot-${index}`} object={child} />
        ))
      })()}

      {/* Utility pants */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 0.18]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Knee pads */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.09, 0.06, 0.09]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.09, 0.06, 0.09]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Breaching tool */}
      <mesh position={[0.35, 1.0, 0.2]} castShadow>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#6a6a6a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Radio communicator */}
      <mesh position={[0.16, 1.35, 0.08]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

// FIELD MEDIC
export const FieldMedic: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<Group>(null)
  const anatomy = useMemo(() => new HumanAnatomy(position, 1.0, 'female', 'athletic'), [position])
  const equipment = useMemo(() => new MilitaryEquipment(), [])

  useFrame((state) => {
    if (groupRef.current) {
      // Ready stance with medical alertness
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.0) * 0.012
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base human anatomy */}
      {(() => {
        const tempGroup = new Group()
        anatomy.createHumanBody(tempGroup, '#e4c4a4')
        return tempGroup.children.map((child, index) => (
          <primitive key={index} object={child} />
        ))
      })()}

      {/* Medical helmet with Red Cross */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Red Cross on helmet */}
      <mesh position={[0, 1.65, 0.14]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.01]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Medical vest with Red Cross markings */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.14]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Large Red Cross on back */}
      <mesh position={[0, 1.3, -0.08]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.01]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Red Cross on front */}
      <mesh position={[0, 1.3, 0.08]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.01]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Medical backpack */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[0.25, 0.35, 0.15]} />
        <meshStandardMaterial color="#2a4a6a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Red Cross on backpack */}
      <mesh position={[0, 1.1, -0.13]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.01]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Medical kit pouches */}
      <mesh position={[-0.12, 1.25, 0.08]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffaaaa" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0.12, 1.25, 0.08]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffaaaa" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Defibrillator */}
      <mesh position={[0.18, 1.35, 0.08]} castShadow>
        <boxGeometry args={[0.06, 0.10, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Medical gloves */}
      <mesh position={[-0.3, 1.2, 0]} castShadow>
        <boxGeometry args={[0.035, 0.075, 0.035]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0.3, 1.2, 0]} castShadow>
        <boxGeometry args={[0.035, 0.075, 0.035]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Medical pants */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.24, 0.55, 0.16]} />
        <meshStandardMaterial color="#4a6a8a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Combat boots */}
      {(() => {
        const tempGroup = new Group()
        equipment.createCombatBoots(
          tempGroup,
          [-0.08, -0.05, 0.08],
          [0.08, -0.05, 0.08]
        )
        return tempGroup.children.map((child, index) => (
          <primitive key={`boot-${index}`} object={child} />
        ))
      })()}

      {/* Medical supplies */}
      <mesh position={[-0.15, 1.15, 0.12]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[-0.15, 1.05, 0.12]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Tourniquet */}
      <mesh position={[0.15, 1.15, 0.12]} castShadow>
        <boxGeometry args={[0.03, 0.06, 0.03]} />
        <meshStandardMaterial color="#ff0000" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Medical scissors */}
      <mesh position={[0.32, 1.1, 0]} castShadow>
        <boxGeometry args={[0.025, 0.08, 0.01]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Bandage roll */}
      <mesh position={[0.15, 1.05, 0.12]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Medical badge on shoulder */}
      <mesh position={[-0.18, 1.4, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color="#ff0000" roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  )
}

