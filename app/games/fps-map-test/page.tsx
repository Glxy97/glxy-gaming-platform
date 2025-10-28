'use client'

import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Sky } from '@react-three/drei'
import FPSSimpleMap from '../../../components/games/fps/FPSSimpleMap'

export default function FPSMapTestPage() {
  const [cameraMode, setCameraMode] = useState<'free' | 'fps'>('free')
  const [selectedTeam, setSelectedTeam] = useState<'alpha' | 'bravo'>('alpha')

  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden">
      <div className="flex h-full">
        {/* Control Panel */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4 text-center">🗺️ FPS MAP TEST</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Simple 3D Map with Buildings
          </p>

          {/* Camera Controls */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">📷 Camera Mode:</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCameraMode('free')}
                className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                  cameraMode === 'free'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                🎯 Free Camera (Orbit)
              </button>
              <button
                onClick={() => setCameraMode('fps')}
                className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                  cameraMode === 'fps'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                👁️ FPS View (Coming Soon)
              </button>
            </div>
          </div>

          {/* Team Selection */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">⚔️ Team Selection:</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedTeam('alpha')}
                className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                  selectedTeam === 'alpha'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                🔴 Alpha Team (Red)
              </button>
              <button
                onClick={() => setSelectedTeam('bravo')}
                className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                  selectedTeam === 'bravo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                🔵 Bravo Team (Blue)
              </button>
            </div>
          </div>

          {/* Map Features */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">🏗️ Map Features:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>✅ Central 2-Story Building</div>
              <div>✅ 4 Corner Buildings</div>
              <div>✅ Long Side Buildings</div>
              <div>✅ 12+ Cover Crates</div>
              <div>✅ Low Walls for Cover</div>
              <div>✅ Street Roads</div>
              <div>✅ 8 Decorative Trees</div>
              <div>✅ 8 Light Poles</div>
              <div>✅ Barbed Wire Fences</div>
              <div>✅ Team Spawn Points</div>
              <div>✅ Central Capture Point</div>
            </div>
          </div>

          {/* Controls Guide */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">🎮 Controls:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="font-semibold text-blue-400">• Left Click + Drag:</div>
              <div className="ml-2">Rotate Camera</div>
              <div className="font-semibold text-green-400">• Right Click + Drag:</div>
              <div className="ml-2">Pan Camera</div>
              <div className="font-semibold text-yellow-400">• Mouse Wheel:</div>
              <div className="ml-2">Zoom In/Out</div>
              <div className="font-semibold text-red-400">• Double Click:</div>
              <div className="ml-2">Reset View</div>
            </div>
          </div>

          {/* Spawn Points Info */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">🚩 Spawn Points:</h3>
            <div className="text-xs text-gray-300 space-y-2">
              <div>
                <span className="text-red-400">● Alpha Team:</span>
                <div className="ml-2">North-West Corner (-40, -40)</div>
              </div>
              <div>
                <span className="text-blue-400">● Bravo Team:</span>
                <div className="ml-2">South-East Corner (40, 40)</div>
              </div>
              <div>
                <span className="text-yellow-400">⭐ Objective:</span>
                <div className="ml-2">Central Capture Point (0, 0)</div>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">🎯 Supported Game Modes:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Team Deathmatch</div>
              <div>• Capture the Flag</div>
              <div>• Search & Destroy</div>
              <div>• Domination</div>
              <div>• Free for All</div>
            </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            camera={{
              position: cameraMode === 'free' ? [50, 30, 50] : [0, 5, 0],
              fov: 60
            }}
          >
            {/* Lighting */}
            <Sky
              distance={450000}
              sunPosition={[100, 20, 100]}
              inclination={0.6}
              azimuth={0.25}
            />

            <ambientLight intensity={0.3} />
            <directionalLight
              position={[50, 50, 25]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={200}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
            />

            {/* Additional lights for atmosphere */}
            <pointLight position={[20, 10, 20]} intensity={0.5} color="#ffffff" />
            <pointLight position={[-20, 10, -20]} intensity={0.5} color="#ffffff" />
            <pointLight position={[20, 10, -20]} intensity={0.3} color="#60a5fa" />
            <pointLight position={[-20, 10, 20]} intensity={0.3} color="#60a5fa" />

            {/* Camera Controls */}
            {cameraMode === 'free' && (
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={200}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2.5}
                enableDamping={true}
                dampingFactor={0.05}
                zoomSpeed={0.8}
                panSpeed={1}
                rotateSpeed={0.5}
              />
            )}

            {/* Map Environment */}
            <Suspense fallback={null}>
              <FPSSimpleMap />

              {/* Sample Player at Spawn Point */}
              {selectedTeam === 'alpha' ? (
                <group position={[-40, 1, -40]}>
                  <mesh position={[0, 1, 0]} castShadow>
                    <boxGeometry args={[1, 2, 1]} />
                    <meshStandardMaterial color="#dc2626" />
                  </mesh>
                </group>
              ) : (
                <group position={[40, 1, 40]}>
                  <mesh position={[0, 1, 0]} castShadow>
                    <boxGeometry args={[1, 2, 1]} />
                    <meshStandardMaterial color="#2563eb" />
                  </mesh>
                </group>
              )}
            </Suspense>

            {/* Fog for atmosphere */}
            <fog attach="fog" args={['#1a202c', 50, 200]} />
          </Canvas>

          {/* Info Overlay */}
          <div className="absolute top-4 left-4 bg-gray-800/90 p-4 rounded-lg max-w-sm">
            <h2 className="text-xl font-bold mb-2">FPS Test Map</h2>
            <div className="flex gap-2 mb-3">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                selectedTeam === 'alpha' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {selectedTeam === 'alpha' ? 'ALPHA TEAM' : 'BRAVO TEAM'}
              </span>
              <span className="px-3 py-1 rounded text-sm font-semibold bg-green-600">
                {cameraMode === 'free' ? 'FREE CAM' : 'FPS MODE'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <p>🗺️ 100x100 meter battlefield</p>
              <p>🏢 7+ Buildings for cover</p>
              <p>🎯 Central objective point</p>
            </div>
          </div>

          {/* Minimap */}
          <div className="absolute bottom-4 right-4 bg-gray-800/90 p-3 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">🗺️ Minimap</h3>
            <div className="w-32 h-32 bg-gray-700 rounded relative border border-gray-600">
              {/* Simple minimap representation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div className="absolute top-4 left-4 w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>

              {/* Building positions on minimap */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-600 rounded"></div>
              <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-gray-600 rounded"></div>
              <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-gray-600 rounded"></div>

              {/* Player position */}
              <div className={`absolute ${
                selectedTeam === 'alpha' ? 'top-4 left-4' : 'bottom-4 right-4'
              } w-2 h-2 ${
                selectedTeam === 'alpha' ? 'bg-red-400' : 'bg-blue-400'
              } rounded-full animate-pulse`}></div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              <div>🔴 Alpha: NW</div>
              <div>🔵 Bravo: SE</div>
              <div>⭐ Target: Center</div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="absolute top-4 right-4 bg-gray-800/90 px-3 py-2 rounded-lg text-xs">
            <div className="text-gray-400">Map Performance:</div>
            <div className="text-green-400 font-semibold">✅ Optimized</div>
            <div className="text-gray-300">Objects: ~100</div>
            <div className="text-gray-300">Shadows: Enabled</div>
          </div>
        </div>
      </div>
    </div>
  )
}