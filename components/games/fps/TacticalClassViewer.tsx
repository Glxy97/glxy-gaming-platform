// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, Box, Sphere, Cylinder } from '@react-three/drei'
import { RingGeometry } from 'three'
import { REALISTIC_CLASSES, RealisticAbilityManager } from './RealisticAbilities'
import * as THREE from 'three'

// 3D Model Components for each class
const AssaultOperatorModel = () => {
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (hovered) {
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Body */}
      <Box position={[0, 0, 0]} args={[0.8, 1.8, 0.4]}>
        <meshStandardMaterial color="#2d3748" />
      </Box>
      {/* Helmet */}
        <Box position={[0, 1.2, 0]} args={[0.5, 0.3, 0.5]}>
        <meshStandardMaterial color="#1a202c" />
      </Box>
      {/* Assault Rifle */}
      <Box position={[0.6, 0.3, 0.2]} args={[0.8, 0.15, 0.1]} rotation={[0, 0, -0.1]}>
        <meshStandardMaterial color="#4a5568" />
      </Box>
      {/* Tactical Vest */}
      <Box position={[0, -0.2, 0]} args={[0.9, 0.8, 0.3]}>
        <meshStandardMaterial color="#2b6cb0" />
      </Box>
      {/* Boots */}
      <Box position={[-0.2, -1.1, 0]} args={[0.2, 0.2, 0.4]}>
        <meshStandardMaterial color="#1a202c" />
      </Box>
      <Box position={[0.2, -1.1, 0]} args={[0.2, 0.2, 0.4]}>
        <meshStandardMaterial color="#1a202c" />
      </Box>
    </group>
  )
}

const ReconSpecialistModel = () => {
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (hovered) {
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Body - Slimmer build */}
      <Box position={[0, 0, 0]} args={[0.7, 1.8, 0.35]}>
        <meshStandardMaterial color="#2b6cb0" />
      </Box>
      {/* Helmet with ghillie attachment */}
      <Box position={[0, 1.2, 0]} args={[0.45, 0.25, 0.45]}>
        <meshStandardMaterial color="#1e40af" />
      </Box>
      {/* Sniper Rifle */}
      <Box position={[0.7, 0.2, 0.1]} args={[1.2, 0.12, 0.08]} rotation={[0, 0, -0.05]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      {/* Scope */}
      <Box position={[1.2, 0.25, 0.1]} args={[0.15, 0.08, 0.08]}>
        <meshStandardMaterial color="#111827" />
      </Box>
      {/* Tactical Backpack */}
      <Box position={[0, 0.3, -0.25]} args={[0.6, 0.7, 0.2]}>
        <meshStandardMaterial color="#1e40af" />
      </Box>
      {/* Binoculars on chest */}
      <Box position={[0.3, 0.1, 0.15]} args={[0.15, 0.05, 0.1]}>
        <meshStandardMaterial color="#374151" />
      </Box>
    </group>
  )
}

const MarksmanOperatorModel = () => {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Body - Crouched position */}
      <Box position={[0, -0.3, 0]} args={[0.75, 1.5, 0.35]}>
        <meshStandardMaterial color="#744210" />
      </Box>
      {/* Ghillie suit elements */}
      <Box position={[0, 0.8, 0]} args={[0.8, 0.4, 0.4]}>
        <meshStandardMaterial color="#92400e" />
      </Box>
      {/* Heavy Sniper Rifle */}
      <Box position={[0.6, -0.2, 0.2]} args={[1.4, 0.14, 0.09]} rotation={[0, 0.1, 0]}>
        <meshStandardMaterial color="#451a03" />
      </Box>
      {/* Bipod */}
      <Box position={[0.8, -0.9, 0.2]} args={[0.3, 0.05, 0.2]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      {/* Range Finder */}
      <Box position={[-0.3, 0, 0.2]} args={[0.1, 0.06, 0.08]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
    </group>
  )
}

const CombatEngineerModel = () => {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Body - Heavier build */}
      <Box position={[0, 0, 0]} args={[0.85, 1.8, 0.4]}>
        <meshStandardMaterial color="#6b7280" />
      </Box>
      {/* Hard Hat */}
        <Box position={[0, 1.2, 0]} args={[0.5, 0.2, 0.5]}>
        <meshStandardMaterial color="#fbbf24" />
      </Box>
      {/* Combat Rifle */}
      <Box position={[0.6, 0.3, 0.2]} args={[0.75, 0.15, 0.1]} rotation={[0, 0, -0.1]}>
        <meshStandardMaterial color="#4b5563" />
      </Box>
      {/* Tool Belt */}
      <Box position={[0, -0.5, 0]} args={[1.0, 0.1, 0.35]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      {/* C4 Charges on vest */}
      <Box position={[0.3, 0.1, 0.2]} args={[0.12, 0.08, 0.05]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      <Box position={[-0.3, 0.1, 0.2]} args={[0.12, 0.08, 0.05]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      {/* Heavy Boots */}
      <Box position={[-0.25, -1.1, 0]} args={[0.25, 0.25, 0.45]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
      <Box position={[0.25, -1.1, 0]} args={[0.25, 0.25, 0.45]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
    </group>
  )
}

const FieldMedicModel = () => {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Body */}
      <Box position={[0, 0, 0]} args={[0.8, 1.8, 0.4]}>
        <meshStandardMaterial color="#059669" />
      </Box>
      {/* Helmet with red cross */}
      <Box position={[0, 1.2, 0]} args={[0.5, 0.3, 0.5]}>
        <meshStandardMaterial color="#047857" />
      </Box>
      {/* Red Cross on helmet */}
      <Box position={[0, 1.35, 0.26]} args={[0.15, 0.02, 0.02]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      <Box position={[0, 1.35, 0.26]} args={[0.02, 0.15, 0.02]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      {/* Carbine */}
      <Box position={[0.6, 0.3, 0.2]} args={[0.7, 0.14, 0.1]} rotation={[0, 0, -0.1]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      {/* Medical Kit */}
      <Box position={[-0.4, 0.1, 0.2]} args={[0.2, 0.15, 0.1]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      {/* Red Cross on medkit */}
      <Box position={[-0.4, 0.18, 0.25]} args={[0.08, 0.01, 0.01]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      <Box position={[-0.4, 0.18, 0.25]} args={[0.01, 0.08, 0.01]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      {/* Defibrillator */}
      <Box position={[0.4, 0.1, 0.2]} args={[0.12, 0.18, 0.08]}>
        <meshStandardMaterial color="#fbbf24" />
      </Box>
    </group>
  )
}

// Environment Components
const TacticalEnvironment = () => {
  return (
    <group>
      {/* Ground */}
      <Box position={[0, -1.5, 0]} args={[20, 0.2, 20]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>

      {/* Concrete barriers */}
      <Box position={[-3, -0.5, -2]} args={[1, 1, 2]}>
        <meshStandardMaterial color="#6b7280" />
      </Box>
      <Box position={[3, -0.5, -2]} args={[1, 1, 2]}>
        <meshStandardMaterial color="#6b7280" />
      </Box>

      {/* Sandbags */}
      <Box position={[-5, -1, 0]} args={[2, 0.5, 1]}>
        <meshStandardMaterial color="#92400e" />
      </Box>
      <Box position={[5, -1, 0]} args={[2, 0.5, 1]}>
        <meshStandardMaterial color="#92400e" />
      </Box>

      {/* Watchtowers */}
      <Box position={[-8, 2, -5]} args={[1.5, 4, 1.5]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Box position={[8, 2, -5]} args={[1.5, 4, 1.5]}>
        <meshStandardMaterial color="#374151" />
      </Box>

      {/* Barbed wire */}
      <Cylinder position={[-6, -0.8, 2]} args={[0.05, 0.05, 3, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#6b7280" />
      </Cylinder>
      <Cylinder position={[6, -0.8, 2]} args={[0.05, 0.05, 3, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#6b7280" />
      </Cylinder>

      {/* Crates */}
      <Box position={[0, -0.8, 4]} args={[1.5, 1.5, 1.5]}>
        <meshStandardMaterial color="#92400e" />
      </Box>
      <Box position={[-2, -0.6, 5]} args={[1, 1, 1]}>
        <meshStandardMaterial color="#78350f" />
      </Box>

      {/* Target practice dummies */}
      <Box position={[4, -0.2, 3]} args={[0.3, 1.5, 0.1]}>
        <meshStandardMaterial color="#ef4444" />
      </Box>
      <Box position={[-4, -0.2, 3]} args={[0.3, 1.5, 0.1]}>
        <meshStandardMaterial color="#ef4444" />
      </Box>
    </group>
  )
}

// Model selector component
const ClassModel = ({ classId, isSelected }: { classId: string, isSelected: boolean }) => {
  const modelComponents = {
    'assault_operator': <AssaultOperatorModel />,
    'recon_specialist': <ReconSpecialistModel />,
    'marksman': <MarksmanOperatorModel />,
    'combat_engineer': <CombatEngineerModel />,
    'field_medic': <FieldMedicModel />
  }

  return (
    <group position={[0, 1, 0]}>
      {modelComponents[classId as keyof typeof modelComponents]}
      {isSelected && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[2, 2, 0.05, 32]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      )}
    </group>
  )
}

// Main Component
export default function TacticalClassViewer() {
  const [selectedClass, setSelectedClass] = useState('assault_operator')
  const [abilityManager] = useState(() => new RealisticAbilityManager())
  const [showAbilities, setShowAbilities] = useState(false)

  useEffect(() => {
    abilityManager.selectClass(selectedClass)
  }, [selectedClass, abilityManager])

  const currentClass = REALISTIC_CLASSES.find(c => c.id === selectedClass)

  return (
    <div className="w-full h-screen bg-gray-900 text-white">
      <div className="flex h-full">
        {/* Left Panel - Class Selection */}
        <div className="w-96 bg-gray-800 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">TACTICAL OPERATIONS</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Modern Special Forces Classes • Select Your Operator
          </p>

          <div className="space-y-4">
            {REALISTIC_CLASSES.map(cls => (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedClass === cls.id
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{cls.icon}</span>
                  <div>
                    <h3 className="font-bold">{cls.name}</h3>
                    <p className="text-xs text-gray-300">{cls.role}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{cls.description}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Health:</span> {cls.health}
                  </div>
                  <div>
                    <span className="text-gray-400">Armor:</span> {cls.armor}
                  </div>
                  <div>
                    <span className="text-gray-400">Speed:</span> {cls.speed}x
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAbilities(!showAbilities)}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
          >
            {showAbilities ? 'Hide' : 'Show'} Abilities & Equipment
          </button>
        </div>

        {/* Center - 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
            <PerspectiveCamera makeDefault position={[5, 3, 5]} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
              maxPolarAngle={Math.PI / 2}
            />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-10, 10, -5]} intensity={0.5} color="#60a5fa" />

            <Suspense fallback={null}>
              <TacticalEnvironment />
              <ClassModel classId={selectedClass} isSelected={true} />
            </Suspense>

            <Environment preset="warehouse" />
          </Canvas>

          {/* Class Info Overlay */}
          {currentClass && (
            <div className="absolute top-4 left-4 bg-gray-800/90 p-4 rounded-lg max-w-sm">
              <h2 className="text-xl font-bold mb-2">{currentClass.name}</h2>
              <p className="text-sm text-gray-300 mb-3">{currentClass.role}</p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Primary Weapons:</span>
                  <div className="mt-1">
                    {currentClass.loadout.primary.slice(0, 2).map(weapon => (
                      <div key={weapon} className="text-gray-300">• {weapon}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Equipment:</span>
                  <div className="mt-1">
                    {currentClass.loadout.equipment.slice(0, 3).map(item => (
                      <div key={item} className="text-gray-300">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Abilities & Equipment */}
        {showAbilities && currentClass && (
          <div className="w-96 bg-gray-800 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Class Abilities</h2>

            <div className="space-y-4">
              {currentClass.abilities.map(ability => {
                const status = abilityManager.getAbilityStatus(ability.id)
                return (
                  <div key={ability.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{ability.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{ability.name}</h3>
                        <p className="text-xs text-gray-400">{ability.equipment}</p>
                      </div>
                      <div className="text-xs text-right">
                        <div className="text-green-400">Realism: {ability.realism}/10</div>
                        <div className="text-gray-400">
                          {status.cooldownRemaining > 0
                            ? `${status.cooldownRemaining}s`
                            : 'Ready'}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{ability.description}</p>

                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="bg-gray-600 px-2 py-1 rounded">
                        CD: {ability.cooldown/1000}s
                      </span>
                      {ability.duration > 0 && (
                        <span className="bg-gray-600 px-2 py-1 rounded">
                          Duration: {ability.duration/1000}s
                        </span>
                      )}
                      {ability.uses > 0 && (
                        <span className="bg-gray-600 px-2 py-1 rounded">
                          Uses: {ability.uses === -1 ? '∞' : ability.uses}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <h2 className="text-xl font-bold mb-4 mt-6">Full Loadout</h2>

            <div className="space-y-3">
              {abilityManager.getEquipmentList().map(category => (
                <div key={category.category} className="bg-gray-700 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-gray-300">{category.category}</h3>
                  <div className="text-xs space-y-1">
                    {category.items.map(item => (
                      <div key={item} className="text-gray-400">• {item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Military Background</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {abilityManager.getRealisticDescription()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}