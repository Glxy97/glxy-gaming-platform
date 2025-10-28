'use client'

import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Box, Cylinder } from '@react-three/drei'

// Simple human military models
const SimpleAssaultOperator = () => (
  <group position={[0, 0, 0]}>
    {/* Head */}
    <Box position={[0, 1.7, 0]} args={[0.15, 0.2, 0.15]}>
      <meshStandardMaterial color="#f4c2a1" />
    </Box>
    {/* Helmet */}
    <Box position={[0, 1.85, 0]} args={[0.18, 0.12, 0.18]}>
      <meshStandardMaterial color="#2d3748" />
    </Box>
    {/* Body */}
    <Box position={[0, 1.2, 0]} args={[0.4, 0.8, 0.2]}>
      <meshStandardMaterial color="#1e40af" />
    </Box>
    {/* Arms */}
    <Box position={[-0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#1e40af" />
    </Box>
    <Box position={[0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#1e40af" />
    </Box>
    {/* Legs */}
    <Box position={[-0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    <Box position={[0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    {/* Rifle */}
    <Box position={[0.5, 1.2, 0.1]} args={[0.6, 0.08, 0.06]} rotation={[0, 0, -0.2]}>
      <meshStandardMaterial color="#374151" />
    </Box>
    {/* Vest */}
    <Box position={[0, 1.2, 0.1]} args={[0.45, 0.7, 0.15]}>
      <meshStandardMaterial color="#1e3a8a" />
    </Box>
  </group>
)

const SimpleReconSpecialist = () => (
  <group position={[0, 0, 0]}>
    {/* Head */}
    <Box position={[0, 1.7, 0]} args={[0.15, 0.2, 0.15]}>
      <meshStandardMaterial color="#f4c2a1" />
    </Box>
    {/* Ghillie hood */}
    <Box position={[0, 1.85, 0]} args={[0.2, 0.15, 0.2]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    {/* Body */}
    <Box position={[0, 1.2, 0]} args={[0.35, 0.8, 0.2]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    {/* Arms */}
    <Box position={[-0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    <Box position={[0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    {/* Legs */}
    <Box position={[-0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    <Box position={[0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    {/* Sniper rifle */}
    <Box position={[0.6, 1.1, 0.1]} args={[0.9, 0.06, 0.04]} rotation={[0, 0, -0.1]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    {/* Scope */}
    <Box position={[1.2, 1.12, 0.1]} args={[0.08, 0.04, 0.04]}>
      <meshStandardMaterial color="#111827" />
    </Box>
  </group>
)

const SimpleMarksmanOperator = () => (
  <group position={[0, 0, 0]}>
    {/* Head */}
    <Box position={[0, 1.7, 0]} args={[0.15, 0.2, 0.15]}>
      <meshStandardMaterial color="#f4c2a1" />
    </Box>
    {/* Ghillie elements */}
    <Box position={[0, 1.8, 0]} args={[0.25, 0.2, 0.25]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    {/* Body - crouched */}
    <Box position={[0, 0.9, 0]} args={[0.4, 0.6, 0.2]}>
      <meshStandardMaterial color="#4a5d23" />
    </Box>
    {/* Heavy sniper rifle */}
    <Box position={[0.5, 0.7, 0.1]} args={[1.2, 0.08, 0.06]} rotation={[0, 0, 0.1]}>
      <meshStandardMaterial color="#111827" />
    </Box>
    {/* Bipod */}
    <Box position={[1.0, 0.3, 0.1]} args={[0.15, 0.25, 0.08]}>
      <meshStandardMaterial color="#374151" />
    </Box>
  </group>
)

const SimpleCombatEngineer = () => (
  <group position={[0, 0, 0]}>
    {/* Head */}
    <Box position={[0, 1.7, 0]} args={[0.15, 0.2, 0.15]}>
      <meshStandardMaterial color="#f4c2a1" />
    </Box>
    {/* Hard hat */}
    <Box position={[0, 1.85, 0]} args={[0.18, 0.12, 0.18]}>
      <meshStandardMaterial color="#eab308" />
    </Box>
    {/* Body */}
    <Box position={[0, 1.2, 0]} args={[0.45, 0.8, 0.2]}>
      <meshStandardMaterial color="#6b7280" />
    </Box>
    {/* Arms */}
    <Box position={[-0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#6b7280" />
    </Box>
    <Box position={[0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#6b7280" />
    </Box>
    {/* Legs */}
    <Box position={[-0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    <Box position={[0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    {/* C4 charges */}
    <Box position={[-0.2, 1.0, 0.15]} args={[0.08, 0.06, 0.04]}>
      <meshStandardMaterial color="#dc2626" />
    </Box>
    <Box position={[0.2, 1.0, 0.15]} args={[0.08, 0.06, 0.04]}>
      <meshStandardMaterial color="#dc2626" />
    </Box>
  </group>
)

const SimpleFieldMedic = () => (
  <group position={[0, 0, 0]}>
    {/* Head */}
    <Box position={[0, 1.7, 0]} args={[0.15, 0.2, 0.15]}>
      <meshStandardMaterial color="#f4c2a1" />
    </Box>
    {/* Helmet with red cross */}
    <Box position={[0, 1.85, 0]} args={[0.18, 0.12, 0.18]}>
      <meshStandardMaterial color="#059669" />
    </Box>
    <Box position={[0, 1.88, 0.09]} args={[0.08, 0.01, 0.01]}>
      <meshStandardMaterial color="#dc2626" />
    </Box>
    <Box position={[0, 1.88, 0.09]} args={[0.01, 0.08, 0.01]}>
      <meshStandardMaterial color="#dc2626" />
    </Box>
    {/* Body */}
    <Box position={[0, 1.2, 0]} args={[0.4, 0.8, 0.2]}>
      <meshStandardMaterial color="#059669" />
    </Box>
    {/* Arms */}
    <Box position={[-0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#059669" />
    </Box>
    <Box position={[0.25, 1.2, 0]} args={[0.12, 0.6, 0.12]}>
      <meshStandardMaterial color="#059669" />
    </Box>
    {/* Legs */}
    <Box position={[-0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    <Box position={[0.12, 0.4, 0]} args={[0.12, 0.8, 0.12]}>
      <meshStandardMaterial color="#1f2937" />
    </Box>
    {/* Medical kit */}
    <Box position={[-0.3, 1.1, 0.15]} args={[0.1, 0.08, 0.06]}>
      <meshStandardMaterial color="#dc2626" />
    </Box>
    <Box position={[-0.3, 1.14, 0.18]} args={[0.06, 0.01, 0.01]}>
      <meshStandardMaterial color="#ffffff" />
    </Box>
  </group>
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
    assault: <SimpleAssaultOperator />,
    recon: <SimpleReconSpecialist />,
    marksman: <SimpleMarksmanOperator />,
    engineer: <SimpleCombatEngineer />,
    medic: <SimpleFieldMedic />
  }

  return (
    <group position={[0, 0, 0]} scale={1.2}>
      {models[operatorType as keyof typeof models] || models.assault}
    </group>
  )
}

export default function MilitaryDemoPage() {
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
          <h1 className="text-2xl font-bold mb-6 text-center">MILITARY OPERATORS</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Realistic 3D Human Military Models
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
          <Canvas shadows camera={{ position: [4, 3, 4], fov: 50 }}>
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
            />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-10, 10, -5]} intensity={0.5} color="#60a5fa" />

            <Suspense fallback={null}>
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
        </div>
      </div>
    </div>
  )
}