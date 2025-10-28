'use client';

import React, { useState } from 'react';
import RealisticMilitaryModelsDemo from '@/components/games/fps/RealisticMilitaryModelsDemo';

export default function MilitaryModelsDemoPage() {
  const [showControls, setShowControls] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Realistic Military Models Demo</h1>
            <p className="text-gray-400 text-sm mt-1">
              Advanced Three.js human soldier models with anatomically correct details
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showControls}
                onChange={(e) => setShowControls(e.target.checked)}
                className="rounded"
              />
              Show Controls
            </label>

            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="rounded"
              />
              Auto Rotate
            </label>
          </div>
        </div>
      </div>

      {/* Main Demo */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">About This Demo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-blue-400">Realistic Human Anatomy</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Muscular definition with athletic builds</li>
                  <li>• Proper human proportions and anatomy</li>
                  <li>• Organic shapes using advanced geometry</li>
                  <li>• No "Lego figure" appearance - real human forms</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-green-400">Military Equipment</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Class-specific weapons and gear</li>
                  <li>• Tactical vests, helmets, and pouches</li>
                  <li>• Realistic equipment placement</li>
                  <li>• Team-specific camouflage patterns</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">Technical Features</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• PBR materials for realistic rendering</li>
                  <li>• Skeletal animation system</li>
                  <li>• Facial blend shapes for expressions</li>
                  <li>• LOD system for performance optimization</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-orange-400">Operator Classes</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• <strong>Assault:</strong> Heavy weapons, grenades</li>
                  <li>• <strong>Recon:</strong> Sniper rifle, surveillance gear</li>
                  <li>• <strong>Marksman:</strong> Battle rifle, spotting scope</li>
                  <li>• <strong>Engineer:</strong> Carbine, toolkit</li>
                  <li>• <strong>Medic:</strong> SMG, medical kit</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3D Demo Container */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Interactive 3D Demo</h2>
            <div className="relative w-full h-[600px]">
              <RealisticMilitaryModelsDemo
                className="w-full h-full"
                showControls={showControls}
                autoRotate={autoRotate}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Controls & Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-blue-400 mb-2">Mouse Controls</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• <strong>Move:</strong> Click and drag to rotate view</li>
                  <li>• <strong>Zoom:</strong> Mouse wheel to zoom in/out</li>
                  <li>• <strong>Focus:</strong> Click operator classes to focus</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-green-400 mb-2">Environment Settings</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• <strong>Environment:</strong> Training, Urban, Forest, Desert</li>
                  <li>• <strong>Time of Day:</strong> Dawn, Day, Dusk, Night</li>
                  <li>• <strong>Weather:</strong> Clear, Overcast, Rain, Fog</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-purple-400 mb-2">Squad Formation</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• <strong>Line:</strong> Standard line formation</li>
                  <li>• <strong>V-Formation:</strong> Tactical V shape</li>
                  <li>• <strong>Wedge:</strong> Arrowhead formation</li>
                  <li>• <strong>Circle:</strong> Defensive perimeter</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Technical Specifications</h2>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-xs font-mono overflow-x-auto">
{`Model Specifications:
├── Height: 1.8m (adjustable)
├── Body Parts: Head, Torso, Arms, Legs
├── Muscle Groups: Pectorals, Biceps, Triceps, Abs, etc.
├── Materials: PBR with subsurface scattering
├── Polygons: ~5,000 - 10,000 per model (LOD dependent)
├── Textures: Albedo, Normal, Roughness, Metallic, AO
├── Skeleton: 24 bones for full-body animation
├── Blend Shapes: 6 facial expressions
├── Equipment: Class-specific tactical gear
└── Performance: Optimized for 60+ FPS

Rendering Pipeline:
├── Lighting: PBR with real-time shadows
├── Environment: Dynamic sky and fog
├── Post-processing: Bloom, AO, SSR (optional)
├── LOD System: 3 detail levels (High/Med/Low)
├── Culling: Frustum and occlusion culling
└── Instancing: Efficient batch rendering`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}