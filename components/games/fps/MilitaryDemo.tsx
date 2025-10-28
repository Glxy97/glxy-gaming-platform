// @ts-nocheck
'use client'

import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  AssaultOperator,
  ReconSpecialist,
  MarksmanOperator,
  CombatEngineer,
  FieldMedic
} from './MilitaryOperators'
import {
  EnhancedAssaultOperator,
  EnhancedReconSpecialist
} from './MilitaryOperatorsEnhanced'
import { TacticalEnvironment } from './TacticalEnvironment'

// Model showcase component
const ModelShowcase: React.FC<{ operatorType: string; enhanced?: boolean }> = ({
  operatorType,
  enhanced = false
}) => {
  const [hovered, setHovered] = useState(false)

  const renderOperator = () => {
    const props = {
      position: [0, 0, 0] as [number, number, number],
      isAnimating: true,
      onHover: setHovered,
      onClick: () => console.log(`Clicked ${operatorType}`),
      operatorName: operatorType.toUpperCase()
    }

    switch (operatorType) {
      case 'assault':
        return enhanced ? (
          <EnhancedAssaultOperator {...props} />
        ) : (
          <AssaultOperator position={[0, 0, 0]} />
        )
      case 'recon':
        return enhanced ? (
          <EnhancedReconSpecialist {...props} />
        ) : (
          <ReconSpecialist position={[0, 0, 0]} />
        )
      case 'marksman':
        return <MarksmanOperator position={[0, 0, 0]} />
      case 'engineer':
        return <CombatEngineer position={[0, 0, 0]} />
      case 'medic':
        return <FieldMedic position={[0, 0, 0]} />
      default:
        return <AssaultOperator position={[0, 0, 0]} />
    }
  }

  return (
    <group>
      {/* Lighting */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.4} />
      <pointLight position={[-5, 3, 0]} intensity={0.3} color="#4488ff" />
      <pointLight position={[5, 3, 0]} intensity={0.3} color="#ff4444" />

      {/* Operator */}
      {renderOperator()}

      {/* Environment */}
      <TacticalEnvironment environmentType="urban" />

      {/* Shadow catcher */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.3}
        scale={10}
        blur={2}
        far={5}
      />
    </group>
  )
}

// Operator selection buttons
const OperatorSelector: React.FC<{
  selectedOperator: string
  onSelect: (operator: string) => void
  enhanced: boolean
  onToggleEnhanced: () => void
}> = ({ selectedOperator, onSelect, enhanced, onToggleEnhanced }) => {
  const operators = [
    { id: 'assault', name: 'Assault Operator', description: 'Point Man', color: 'bg-red-600' },
    { id: 'recon', name: 'Recon Specialist', description: 'Sniper', color: 'bg-green-600' },
    { id: 'marksman', name: 'Marksman Operator', description: 'Heavy Sniper', color: 'bg-blue-600' },
    { id: 'engineer', name: 'Combat Engineer', description: 'Demolitions', color: 'bg-orange-600' },
    { id: 'medic', name: 'Field Medic', description: 'Medical Support', color: 'bg-purple-600' }
  ]

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-6 max-w-md">
      <h2 className="text-2xl font-bold text-white mb-4">Military Operators</h2>

      {/* Enhanced Mode Toggle */}
      <div className="mb-6">
        <button
          onClick={onToggleEnhanced}
          className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
            enhanced
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {enhanced ? '✨ Enhanced Mode ON' : 'Standard Mode'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          {enhanced
            ? 'Interactive models with animations and detailed equipment'
            : 'Basic 3D military operator models'
          }
        </p>
      </div>

      {/* Operator Selection */}
      <div className="space-y-3">
        {operators.map((operator) => (
          <button
            key={operator.id}
            onClick={() => onSelect(operator.id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              selectedOperator === operator.id
                ? `${operator.color} text-white shadow-lg transform scale-105`
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:transform hover:scale-102'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{operator.name}</div>
                <div className="text-sm opacity-75">{operator.description}</div>
              </div>
              {selectedOperator === operator.id && (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Model Information */}
      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Model Features:</h3>
        <ul className="text-xs text-gray-300 space-y-1">
          {enhanced ? (
            <>
              <li>• Interactive hover effects</li>
              <li>• Detailed equipment and gear</li>
              <li>• Realistic animations</li>
              <li>• Authentic military proportions</li>
              <li>• Professional lighting system</li>
            </>
          ) : (
            <>
              <li>• Realistic human anatomy</li>
              <li>• Military tactical equipment</li>
              <li>• Multiple operator classes</li>
              <li>• Tactical environment</li>
              <li>• Shadow rendering</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

// Controls information
const ControlsInfo: React.FC = () => (
  <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-6 max-w-sm">
    <h3 className="text-xl font-bold text-white mb-4">3D Controls</h3>

    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          1
        </div>
        <div>
          <p className="text-white font-semibold">Rotate View</p>
          <p className="text-gray-400 text-sm">Left Click + Drag</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          2
        </div>
        <div>
          <p className="text-white font-semibold">Pan Camera</p>
          <p className="text-gray-400 text-sm">Right Click + Drag</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          3
        </div>
        <div>
          <p className="text-white font-semibold">Zoom In/Out</p>
          <p className="text-gray-400 text-sm">Mouse Wheel</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          4
        </div>
        <div>
          <p className="text-white font-semibold">Reset View</p>
          <p className="text-gray-400 text-sm">Double Click</p>
        </div>
      </div>
    </div>

    <div className="mt-6 p-4 bg-slate-800 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-400 mb-2">Technical Specs:</h4>
      <ul className="text-xs text-gray-300 space-y-1">
        <li>• Realistic human proportions</li>
        <li>• 1:1 scale models</li>
        <li>• PBR materials</li>
        <li>• Dynamic shadows</li>
        <li>• 60 FPS target</li>
        <li>• WebGL rendering</li>
      </ul>
    </div>
  </div>
)

// Main Military Demo Component
export const MilitaryDemo: React.FC = () => {
  const [selectedOperator, setSelectedOperator] = useState<string>('assault')
  const [enhancedMode, setEnhancedMode] = useState<boolean>(true)

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [3, 2, 3], fov: 50 }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
                            {/* @ts-ignore - Temporary workaround for PresentationControls type mismatch */}
        <PresentationControls
            global
            rotation={[0, 0, 0]}
            polar={[0, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
            config={{ mass: 2, tension: 400 }}
            snap={{ mass: 4, tension: 400 }}
          >
            <ModelShowcase operatorType={selectedOperator} enhanced={enhancedMode} />
          </PresentationControls>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1.5}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />

          <Environment preset="warehouse" />
        </Suspense>
      </Canvas>

      {/* Left Panel - Operator Selection */}
      <div className="absolute top-6 left-6">
        <OperatorSelector
          selectedOperator={selectedOperator}
          onSelect={setSelectedOperator}
          enhanced={enhancedMode}
          onToggleEnhanced={() => setEnhancedMode(!enhancedMode)}
        />
      </div>

      {/* Right Panel - Controls */}
      <div className="absolute top-6 right-6">
        <ControlsInfo />
      </div>

      {/* Bottom Information Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Military Tactical Operators 3D
              </h1>
              <p className="text-gray-300">
                Realistic human military models with authentic equipment and gear
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Operator</p>
                <p className="text-white font-semibold capitalize">
                  {selectedOperator} {enhancedMode && '(Enhanced)'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">Rendering Mode</p>
                <p className="text-white font-semibold">
                  {enhancedMode ? 'Interactive 3D' : 'Standard 3D'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Loading 3D Models</p>
          <p className="text-gray-400 text-sm">Preparing military operators...</p>
        </div>
      </div>
    </div>
  )
}

export default MilitaryDemo