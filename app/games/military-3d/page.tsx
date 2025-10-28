'use client'

import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Box, Cylinder, Sphere, Capsule, Torus } from '@react-three/drei'

// Truly Realistic Human Soldier with organic shapes
const HumanSoldier = ({
  scale = 1,
  bodyColor = '#2d3748',
  hasHelmet = true,
  hasVest = true,
  primaryWeapon = 'assault',
  secondaryItems = []
}: {
  scale?: number
  bodyColor?: string
  hasHelmet?: boolean
  hasVest?: boolean
  primaryWeapon?: string
  secondaryItems?: string[]
}) => {
  return (
    <group scale={scale}>
      {/* Head - organic human shape */}
      <group position={[0, 1.7, 0]}>
        {/* Cranium - elongated sphere */}
        <Sphere position={[0, 0.02, 0]} args={[0.11, 32, 32]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Forehead */}
        <Sphere position={[0, 0.08, -0.02]} args={[0.09, 24, 24]} scale={[1.2, 0.8, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Cheeks */}
        <Sphere position={[-0.06, 0, 0.04]} args={[0.035, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        <Sphere position={[0.06, 0, 0.04]} args={[0.035, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Chin - rounded */}
        <Sphere position={[0, -0.08, 0.03]} args={[0.045, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Nose bridge */}
        <Capsule position={[0, 0.02, 0.11]} args={[0.015, 0.08, 8]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.7} metalness={0.05} />
        </Capsule>
      </group>

      {/* Neck - muscular transition */}
      <group position={[0, 1.55, 0]}>
        {/* Trapezius muscles */}
        <Sphere position={[-0.08, 0.03, 0]} args={[0.035, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        <Sphere position={[0.08, 0.03, 0]} args={[0.035, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Neck column */}
        <Cylinder args={[0.06, 0.07, 0.12, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Cylinder>
      </group>

      {/* Torso - athletic military build */}
      <group position={[0, 1.2, 0]}>
        {/* Pectoral muscles - more defined */}
        <Sphere position={[-0.08, 0.18, 0.08]} args={[0.11, 16, 16]} scale={[1.1, 0.7, 1.3]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
        <Sphere position={[0.08, 0.18, 0.08]} args={[0.11, 16, 16]} scale={[1.1, 0.7, 1.3]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
        {/* Rib cage - athletic V-shape */}
        <Capsule position={[0, 0.08, 0]} args={[0.16, 0.22, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Abdominal muscles - six pack! */}
        <Box position={[-0.04, -0.05, 0.1]} args={[0.03, 0.06, 0.08]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
        </Box>
        <Box position={[0.04, -0.05, 0.1]} args={[0.03, 0.06, 0.08]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
        </Box>
        {/* Side abs */}
        <Box position={[-0.08, -0.08, 0.08]} args={[0.025, 0.05, 0.06]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
        </Box>
        <Box position={[0.08, -0.08, 0.08]} args={[0.025, 0.05, 0.06]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
        </Box>
        {/* Obliques - slim waist */}
        <Capsule position={[0, -0.15, 0]} args={[0.10, 0.12, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Latissimus dorsi (back muscles) - V-taper */}
        <Sphere position={[-0.14, 0.08, -0.08]} args={[0.07, 12, 12]} scale={[1, 1.4, 0.8]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
        <Sphere position={[0.14, 0.08, -0.08]} args={[0.07, 12, 12]} scale={[1, 1.4, 0.8]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
      </group>

      {/* Shoulders - deltoid muscles */}
      <group>
        {/* Left deltoid */}
        <Sphere position={[-0.2, 1.4, 0]} args={[0.08, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Right deltoid */}
        <Sphere position={[0.2, 1.4, 0]} args={[0.08, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Shoulder caps */}
        <Sphere position={[-0.25, 1.38, 0]} args={[0.06, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        <Sphere position={[0.25, 1.38, 0]} args={[0.06, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
      </group>

      {/* Arms - biceps and triceps */}
      <group>
        {/* Left bicep */}
        <Capsule position={[-0.35, 1.1, 0]} args={[0.06, 0.18, 16]} rotation={[Math.PI/2, 0, 0.3]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Capsule>
        {/* Right bicep */}
        <Capsule position={[0.35, 1.1, 0]} args={[0.06, 0.18, 16]} rotation={[Math.PI/2, 0, -0.3]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Capsule>

        {/* Left tricep */}
        <Capsule position={[-0.38, 1.08, 0]} args={[0.05, 0.16, 16]} rotation={[Math.PI/2, 0, 0.3]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Capsule>
        {/* Right tricep */}
        <Capsule position={[0.38, 1.08, 0]} args={[0.05, 0.16, 16]} rotation={[Math.PI/2, 0, -0.3]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Capsule>

        {/* Elbow joints */}
        <Sphere position={[-0.42, 0.85, 0]} args={[0.04, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        <Sphere position={[0.42, 0.85, 0]} args={[0.04, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>

        {/* Left forearm */}
        <Capsule position={[-0.48, 0.6, 0]} args={[0.045, 0.22, 16]} rotation={[Math.PI/2, 0, 0.4]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Right forearm */}
        <Capsule position={[0.48, 0.6, 0]} args={[0.045, 0.22, 16]} rotation={[Math.PI/2, 0, -0.4]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>

        {/* Left hand - palm */}
        <Sphere position={[-0.52, 0.4, 0]} args={[0.035, 12, 12]} scale={[0.8, 1.2, 0.4]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        {/* Right hand - palm */}
        <Sphere position={[0.52, 0.4, 0]} args={[0.035, 12, 12]} scale={[0.8, 1.2, 0.4]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
      </group>

      {/* Pelvis and hips */}
      <group position={[0, 0.85, 0]}>
        {/* Hip bones */}
        <Sphere position={[-0.08, 0, 0]} args={[0.08, 12, 12]} scale={[1, 0.6, 1.2]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
        <Sphere position={[0.08, 0, 0]} args={[0.08, 12, 12]} scale={[1, 0.6, 1.2]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Sphere>
        {/* Pelvis center */}
        <Capsule position={[0, 0, 0]} args={[0.15, 0.12, 16]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
      </group>

      {/* Legs - thighs and calves */}
      <group>
        {/* Left quadricep */}
        <Capsule position={[-0.12, 0.5, 0]} args={[0.07, 0.22, 16]} rotation={[Math.PI/2, 0, 0.1]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Right quadricep */}
        <Capsule position={[0.12, 0.5, 0]} args={[0.07, 0.22, 16]} rotation={[Math.PI/2, 0, -0.1]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>

        {/* Left hamstring */}
        <Capsule position={[-0.08, 0.48, -0.04]} args={[0.06, 0.20, 16]} rotation={[Math.PI/2, 0, 0.1]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Right hamstring */}
        <Capsule position={[0.08, 0.48, -0.04]} args={[0.06, 0.20, 16]} rotation={[Math.PI/2, 0, -0.1]} castShadow receiveShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.15} />
        </Capsule>

        {/* Knee joints */}
        <Sphere position={[-0.1, 0.08, 0]} args={[0.05, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>
        <Sphere position={[0.1, 0.08, 0]} args={[0.05, 12, 12]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4c2a1" roughness={0.85} metalness={0.05} />
        </Sphere>

        {/* Left calf muscle */}
        <Sphere position={[-0.08, -0.12, 0.02]} args={[0.055, 12, 12]} scale={[1, 1.8, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
        </Sphere>
        {/* Right calf muscle */}
        <Sphere position={[0.08, -0.12, 0.02]} args={[0.055, 12, 12]} scale={[1, 1.8, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
        </Sphere>

        {/* Left shin */}
        <Capsule position={[-0.1, -0.12, 0]} args={[0.045, 0.28, 16]} rotation={[Math.PI/2, 0, 0.05]} castShadow receiveShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
        </Capsule>
        {/* Right shin */}
        <Capsule position={[0.1, -0.12, 0]} args={[0.045, 0.28, 16]} rotation={[Math.PI/2, 0, -0.05]} castShadow receiveShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
        </Capsule>

        {/* Left foot - natural shape */}
        <group position={[-0.1, -0.32, 0.05]}>
          {/* Main foot */}
          <Capsule args={[0.04, 0.16, 12]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Capsule>
          {/* Heel */}
          <Sphere position={[-0.06, 0, 0]} args={[0.025, 8, 8]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Sphere>
          {/* Toe area */}
          <Sphere position={[0.06, 0, 0]} args={[0.03, 8, 8]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Sphere>
        </group>
        {/* Right foot - natural shape */}
        <group position={[0.1, -0.32, 0.05]}>
          {/* Main foot */}
          <Capsule args={[0.04, 0.16, 12]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Capsule>
          {/* Heel */}
          <Sphere position={[-0.06, 0, 0]} args={[0.025, 8, 8]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Sphere>
          {/* Toe area */}
          <Sphere position={[0.06, 0, 0]} args={[0.03, 8, 8]} castShadow receiveShadow>
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.15} />
          </Sphere>
        </group>
      </group>

      {/* Equipment - more organic shapes */}
      {hasHelmet && (
        <group position={[0, 1.82, 0]}>
          {/* Helmet - curved shape */}
          <Sphere args={[0.13, 24, 24]} scale={[1, 0.85, 1]} castShadow receiveShadow>
            <meshStandardMaterial color="#2a4d3a" roughness={0.6} metalness={0.4} />
          </Sphere>
          {/* Helmet brim - curved */}
          <Torus position={[0, -0.11, 0]} args={[0.13, 0.02, 8, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#2a4d3a" roughness={0.6} metalness={0.4} />
          </Torus>
          {/* NVG mount */}
          <Box position={[0, 0.05, 0.12]} args={[0.08, 0.025, 0.04]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </Box>
        </group>
      )}

      {hasVest && (
        <group position={[0, 1.2, 0]}>
          {/* Main vest - curved to body */}
          <Sphere position={[0, 0, 0.15]} args={[0.22, 16, 16]} scale={[1, 1.3, 0.8]} castShadow receiveShadow>
            <meshStandardMaterial color="#1e3a8a" roughness={0.8} metalness={0.1} />
          </Sphere>
          {/* Vest panels */}
          <Sphere position={[-0.15, 0, 0.18]} args={[0.12, 12, 12]} scale={[0.8, 1.2, 0.6]} castShadow receiveShadow>
            <meshStandardMaterial color="#1e3a8a" roughness={0.8} metalness={0.1} />
          </Sphere>
          <Sphere position={[0.15, 0, 0.18]} args={[0.12, 12, 12]} scale={[0.8, 1.2, 0.6]} castShadow receiveShadow>
            <meshStandardMaterial color="#1e3a8a" roughness={0.8} metalness={0.1} />
          </Sphere>
        </group>
      )}

      {/* Weapons - more realistic */}
      {primaryWeapon === 'assault' && (
        <group position={[0.6, 1.0, 0.1]} rotation={[0, 0, -0.2]}>
          {/* M4A1 receiver */}
          <Box position={[0, 0, 0]} args={[0.04, 0.15, 0.025]} castShadow receiveShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.8} />
          </Box>
          {/* Barrel */}
          <Cylinder position={[0, 0.18, 0]} args={[0.008, 0.008, 0.20, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.8} />
          </Cylinder>
          {/* Magazine */}
          <Box position={[0, -0.05, 0.01]} args={[0.025, 0.08, 0.035]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.3} />
          </Box>
          {/* Pistol grip */}
          <Box position={[0, -0.08, 0]} args={[0.02, 0.06, 0.03]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </Box>
          {/* Stock */}
          <Box position={[0, -0.15, 0]} args={[0.04, 0.12, 0.02]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </Box>
        </group>
      )}

      {primaryWeapon === 'sniper' && (
        <group position={[0.7, 0.9, 0.1]} rotation={[0, 0, -0.1]}>
          {/* Sniper receiver */}
          <Box position={[0, 0, 0]} args={[0.05, 0.25, 0.03]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </Box>
          {/* Long barrel */}
          <Cylinder position={[0, 0.30, 0]} args={[0.01, 0.01, 0.35, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </Cylinder>
          {/* Scope */}
          <Cylinder position={[0, 0.05, 0.04]} args={[0.02, 0.02, 0.20, 16]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
          </Cylinder>
        </group>
      )}
    </group>
  )
}

// Specialized operator models
const AssaultOperator = () => (
  <HumanSoldier
    bodyColor="#1e40af"
    hasHelmet={true}
    hasVest={true}
    primaryWeapon="assault"
  />
)

const ReconSpecialist = () => (
  <HumanSoldier
    bodyColor="#4a5d23"
    hasHelmet={false}
    hasVest={false}
    primaryWeapon="sniper"
  />
)

const MarksmanOperator = () => (
  <HumanSoldier
    bodyColor="#4a5d23"
    hasHelmet={false}
    hasVest={true}
    primaryWeapon="heavy"
    scale={0.9}
  />
)

const CombatEngineer = () => (
  <HumanSoldier
    bodyColor="#6b7280"
    hasHelmet={true}
    hasVest={true}
    primaryWeapon="assault"
  />
)

const FieldMedic = () => (
  <HumanSoldier
    bodyColor="#059669"
    hasHelmet={true}
    hasVest={true}
    primaryWeapon="assault"
  />
)

// Environment
const SimpleEnvironment = () => (
  <group>
    {/* Ground */}
    <Box position={[0, -0.1, 0]} args={[20, 0.2, 20]}>
      <meshStandardMaterial color="#374151" />
    </Box>
    {/* Barriers */}
    <Box position={[-3, 0.5, -2]} args={[1, 1, 2]}>
      <meshStandardMaterial color="#6b7280" />
    </Box>
    <Box position={[3, 0.5, -2]} args={[1, 1, 2]}>
      <meshStandardMaterial color="#6b7280" />
    </Box>
    {/* Sandbags */}
    <Box position={[-5, 0.2, 0]} args={[2, 0.4, 1]}>
      <meshStandardMaterial color="#92400e" />
    </Box>
    <Box position={[5, 0.2, 0]} args={[2, 0.4, 1]}>
      <meshStandardMaterial color="#92400e" />
    </Box>
  </group>
)

// Model selector
const OperatorModel = ({ operatorType }: { operatorType: string }) => {
  const models = {
    assault: <AssaultOperator />,
    recon: <ReconSpecialist />,
    marksman: <MarksmanOperator />,
    engineer: <CombatEngineer />,
    medic: <FieldMedic />
  }

  return (
    <group position={[0, 0, 0]} scale={1.5}>
      <group rotation={[0, Math.PI / 6, 0]}>
        {models[operatorType as keyof typeof models] || models.assault}
      </group>
    </group>
  )
}

export default function Military3DPage() {
  const [selectedOperator, setSelectedOperator] = useState('assault')

  const operators = [
    { id: 'assault', name: 'Assault Operator', description: 'Point Man', color: 'bg-red-600' },
    { id: 'recon', name: 'Recon Specialist', description: 'Sniper', color: 'bg-green-600' },
    { id: 'marksman', name: 'Marksman Operator', description: 'Heavy Sniper', color: 'bg-blue-600' },
    { id: 'engineer', name: 'Combat Engineer', description: 'Demolitions', color: 'bg-orange-600' },
    { id: 'medic', name: 'Field Medic', description: 'Medical Support', color: 'bg-purple-600' }
  ]

  return (
    <div className="w-full h-screen bg-gray-900 text-white">
      <div className="flex h-full">
        {/* Left Panel - Operator Selection */}
        <div className="w-80 bg-gray-800 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">MILITARY OPERATORS 3D</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Realistic Human Military Models
          </p>

          <div className="space-y-4">
            {operators.map((operator) => (
              <div
                key={operator.id}
                onClick={() => setSelectedOperator(operator.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedOperator === operator.id
                    ? `${operator.color} shadow-lg transform scale-105`
                    : 'bg-gray-700 hover:bg-gray-600 hover:transform hover:scale-102'
                }`}
              >
                <div className="font-semibold">{operator.name}</div>
                <div className="text-sm opacity-75">{operator.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Model Features:</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Realistic human proportions</li>
              <li>• Military tactical equipment</li>
              <li>• Authentic gear and weapons</li>
              <li>• Interactive 3D view</li>
              <li>• Professional lighting</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">3D Controls:</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Left Click + Drag: Rotate</li>
              <li>• Right Click + Drag: Pan</li>
              <li>• Mouse Wheel: Zoom</li>
              <li>• Double Click: Reset View</li>
            </ul>
          </div>
        </div>

        {/* Right - 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas shadows camera={{ position: [3, 2, 3], fov: 60 }}>
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1.5}
              maxDistance={8}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2}
              target={[0, 1, 0]}
            />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.8} color="#60a5fa" />
            <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.5} penumbra={0.5} castShadow />

            <Suspense fallback={null}>
              {/* Test Box to ensure 3D is working */}
              <Box position={[0, 1, 0]} args={[0.5, 1, 0.5]} castShadow receiveShadow>
                <meshStandardMaterial color="#ff0000" />
              </Box>
              <SimpleEnvironment />
              <OperatorModel operatorType={selectedOperator} />
            </Suspense>

            <Environment preset="warehouse" />
          </Canvas>

          {/* Info Overlay */}
          <div className="absolute top-4 left-4 bg-gray-800/90 p-4 rounded-lg max-w-sm">
            <h2 className="text-xl font-bold mb-2 capitalize">
              {operators.find(o => o.id === selectedOperator)?.name}
            </h2>
            <p className="text-sm text-gray-300 mb-3">
              {operators.find(o => o.id === selectedOperator)?.description}
            </p>
            <div className="text-xs text-gray-400">
              <p>Click and drag to rotate • Scroll to zoom</p>
            </div>
          </div>

          {/* Current Operator Display */}
          <div className="absolute bottom-4 right-4 bg-gray-800/90 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-400">Currently Viewing</div>
              <div className="text-lg font-bold capitalize">
                {operators.find(o => o.id === selectedOperator)?.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}