// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { REALISTIC_CLASSES, RealisticAbilityManager } from './RealisticAbilities'

export default function TacticalClassViewerSimple() {
  const [selectedClass, setSelectedClass] = useState('assault_operator')
  const [abilityManager] = useState(() => new RealisticAbilityManager())
  const [showAbilities, setShowAbilities] = useState(false)

  React.useEffect(() => {
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

        {/* Center - 3D Viewer Placeholder */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">{currentClass?.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{currentClass?.name}</h2>
            <p className="text-gray-400 mb-4">{currentClass?.role}</p>

            <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="font-semibold mb-3">Class Preview</h3>
              <p className="text-sm text-gray-300 mb-4">
                3D Model Viewer Coming Soon
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-400 text-xs">Primary Weapons</div>
                  <div className="text-xs mt-1">
                    {currentClass?.loadout.primary.slice(0, 2).map(weapon => (
                      <div key={weapon}>• {weapon}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-400 text-xs">Equipment</div>
                  <div className="text-xs mt-1">
                    {currentClass?.loadout.equipment.slice(0, 3).map(item => (
                      <div key={item}>• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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