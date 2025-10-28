// @ts-nocheck
'use client'

import React, { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  AssaultOperator,
  ReconSpecialist,
  MarksmanOperator,
  CombatEngineer,
  FieldMedic
} from './MilitaryOperators'
import { TacticalEnvironment } from './TacticalEnvironment'

// Operator Information Interface
interface OperatorInfo {
  name: string
  class: string
  role: string
  equipment: string[]
  weapon: string
  description: string
  stats: {
    speed: number
    armor: number
    firepower: number
    stealth: number
    support: number
  }
}

// Operator Data
const operatorData: Record<string, OperatorInfo> = {
  assault: {
    name: "Sgt. Marcus Rodriguez",
    class: "ASSAULT OPERATOR",
    role: "Point Man / Entry Specialist",
    equipment: [
      "M4A1 Carbine with ACOG sight",
      "Tactical Helmet with NVG mount",
      "Level IIIA Ballistic Vest",
      "Combat Medical Kit",
      "Flashbang Grenades (x2)",
      "Breaching Tool",
      "Tactical Radio"
    ],
    weapon: "M4A1 Carbine",
    description: "Lead assault specialist trained in close-quarters battle and room clearing. Expert in tactical entry and dynamic assault operations.",
    stats: {
      speed: 85,
      armor: 70,
      firepower: 90,
      stealth: 60,
      support: 65
    }
  },
  recon: {
    name: "Cpl. Sarah Chen",
    class: "RECON SPECIALIST",
    role: "Sniper / Scout",
    equipment: [
      "M24 Sniper Rifle",
      "Ghillie Suit with camouflage",
      "Spotting Scope",
      "Long-range Radio",
      "Camouflage Face Paint",
      "Compact Binoculars",
      "Silent Movement Gear"
    ],
    weapon: "M24 Sniper Rifle",
    description: "Elite reconnaissance specialist trained in long-range reconnaissance and sniper operations. Master of stealth and camouflage.",
    stats: {
      speed: 75,
      armor: 40,
      firepower: 85,
      stealth: 95,
      support: 60
    }
  },
  marksman: {
    name: "SSgt. James Mitchell",
    class: "MARKSMAN OPERATOR",
    role: "Heavy Sniper / Designated Marksman",
    equipment: [
      "Barrett M82 Anti-materiel Rifle",
      "Heavy Ballistic Vest",
      "Advanced Scope System",
      "Range Finder",
      "Shooting Mat",
      "Heavy Ammunition Loadout",
      "Knee and Elbow Pads"
    ],
    weapon: "Barrett M82 Sniper Rifle",
    description: "Heavy weapons specialist trained in long-range precision shooting and anti-materiel operations. Expert in extreme distance engagements.",
    stats: {
      speed: 60,
      armor: 80,
      firepower: 100,
      stealth: 70,
      support: 50
    }
  },
  engineer: {
    name: "Spc. David Kumar",
    class: "COMBAT ENGINEER",
    role: "Demolitions / Breaching",
    equipment: [
      "Demolition Charges",
      "Breaching Tools",
      "Explosive Ordinance Disposal Kit",
      "Construction Tools",
      "Hard Hat with Headlamp",
      "Heavy Tool Belt",
      "Structural Analysis Equipment"
    ],
    weapon: "Combat Shotgun",
    description: "Combat engineer specializing in demolitions, breaching, and construction. Expert in explosive ordnance and structural manipulation.",
    stats: {
      speed: 70,
      armor: 85,
      firepower: 65,
      stealth: 50,
      support: 90
    }
  },
  medic: {
    name: "Lt. Emily Watson",
    class: "FIELD MEDIC",
    role: "Combat Medic / Medical Support",
    equipment: [
      "Advanced Medical Kit",
      "Defibrillator Unit",
      "Emergency Surgical Tools",
      "Triage Equipment",
      "Medical Backpack",
      "Red Cross Marked Gear",
      "Emergency Blood Supply"
    ],
    weapon: "M4 Carbine",
    description: "Combat medic trained in advanced trauma care and emergency medicine. Expert in battlefield medical response and casualty evacuation.",
    stats: {
      speed: 80,
      armor: 60,
      firepower: 60,
      stealth: 65,
      support: 100
    }
  }
}

// Animated Camera Controller
const CameraController: React.FC<{ targetIndex: number }> = ({ targetIndex }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  useFrame((state) => {
    if (cameraRef.current) {
      const targetPositions = [
        { pos: [5, 3, 5], lookAt: [0, 1, 0] },      // Assault Operator
        { pos: [-5, 3, 5], lookAt: [0, 1, 0] },     // Recon Specialist
        { pos: [5, 3, -5], lookAt: [0, 1, 0] },     // Marksman Operator
        { pos: [-5, 3, -5], lookAt: [0, 1, 0] },    // Combat Engineer
        { pos: [0, 8, 8], lookAt: [0, 1, 0] }       // Field Medic
      ]

      const target = targetPositions[targetIndex]
      const currentPos = cameraRef.current.position
      const currentLookAt = new THREE.Vector3()

      // Smooth camera movement
      cameraRef.current.position.lerp(
        new THREE.Vector3(...target.pos),
        0.05
      )

      // Update OrbitControls target
      if (state.controls && (state.controls as any).target) {
        const targetPos = new THREE.Vector3(...target.lookAt)
        ;(state.controls as any).target.lerp(targetPos, 0.05)
        ;(state.controls as any).update()
      }
    }
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[5, 3, 5]}
      fov={60}
      near={0.1}
      far={1000}
    />
  )
}

// Lighting Setup
const SceneLighting: React.FC = () => {
  return (
    <>
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Ambient fill light */}
      <ambientLight intensity={0.4} color="#e0e0ff" />

      {/* Rim lighting */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Top-down fill light */}
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.3}
        color="#ffffff"
      />

      {/* Colored accent lights for different operators */}
      <pointLight position={[-3, 2, 0]} intensity={0.3} color="#ff6b6b" />
      <pointLight position={[3, 2, 0]} intensity={0.3} color="#4ecdc4" />
      <pointLight position={[0, 2, -3]} intensity={0.3} color="#45b7d1" />
      <pointLight position={[0, 2, 3]} intensity={0.3} color="#96ceb4" />
      <pointLight position={[0, 5, 0]} intensity={0.2} color="#feca57" />
    </>
  )
}

// Main Military Tactical Scene Component
export const MilitaryTacticalScene: React.FC = () => {
  const [selectedOperator, setSelectedOperator] = useState<string>('assault')
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [showStats, setShowStats] = useState<boolean>(true)

  const currentOperator = operatorData[selectedOperator]

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-slate-900 to-slate-800">
      {/* 3D Scene Canvas */}
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 60 }}
        className="w-full h-full"
      >
        <CameraController targetIndex={Object.keys(operatorData).indexOf(selectedOperator)} />

        <SceneLighting />

        <Suspense fallback={null}>
          {/* Tactical Environment */}
          <TacticalEnvironment environmentType="urban" />

          {/* Operator Models */}
          <AssaultOperator position={[-3, 0, 2]} />
          <ReconSpecialist position={[3, 0, 2]} />
          <MarksmanOperator position={[-3, 0, -2]} />
          <CombatEngineer position={[3, 0, -2]} />
          <FieldMedic position={[0, 0, 0]} />

          {/* Ground plane for shadows */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[50, 50]} />
            <shadowMaterial transparent opacity={0.3} />
          </mesh>

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.3}
            scale={20}
            blur={2}
            far={10}
          />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minDistance={3}
          maxDistance={20}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />

        <Environment preset="warehouse" />
      </Canvas>

      {/* UI Overlay - Operator Selection Panel */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
        <h2 className="text-xl font-bold text-white mb-4">Tactical Operators</h2>

        {/* Operator Selection Buttons */}
        <div className="space-y-2 mb-4">
          {Object.entries(operatorData).map(([key, operator]) => (
            <button
              key={key}
              onClick={() => setSelectedOperator(key)}
              className={`w-full text-left px-3 py-2 rounded transition-all ${
                selectedOperator === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <div className="font-semibold">{operator.class}</div>
              <div className="text-xs opacity-75">{operator.role}</div>
            </button>
          ))}
        </div>

        {/* Current Operator Info */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg font-semibold text-white mb-2">{currentOperator.name}</h3>
          <p className="text-sm text-gray-300 mb-3">{currentOperator.description}</p>

          {/* Equipment List */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-400 mb-1">Equipment:</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              {currentOperator.equipment.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-blue-400 mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-400">Combat Stats:</h4>
              {Object.entries(currentOperator.stats).map(([stat, value]) => (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 capitalize">{stat}:</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-slate-700 rounded-full h-2 mr-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs text-white">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Controls</h3>
        <div className="space-y-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-full px-3 py-2 rounded text-sm transition-all ${
              autoRotate
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {autoRotate ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF'}
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`w-full px-3 py-2 rounded text-sm transition-all ${
              showStats
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Camera Controls:</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Left Click + Drag: Rotate</li>
            <li>• Right Click + Drag: Pan</li>
            <li>• Scroll: Zoom In/Out</li>
            <li>• Click operators to focus</li>
          </ul>
        </div>
      </div>

      {/* Information Header */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Military Tactical Operations</h1>
            <p className="text-gray-300">Realistic 3D Human Military Operators - Interactive Tactical Scene</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">5 Specialized Operator Classes</p>
            <p className="text-sm text-gray-400">Authentic Military Equipment</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MilitaryTacticalScene