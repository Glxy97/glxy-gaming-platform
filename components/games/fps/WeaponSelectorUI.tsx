// @ts-nocheck
'use client'

import React from 'react'

interface WeaponSelectorUIProps {
  slots?: any[]
  activeSlotId?: string | null
  weapons?: {
    slot: string
    name: string
    ammo: number
    isActive: boolean
  }[]
  className?: string
}

export function WeaponSelectorUI({ weapons, slots, activeSlotId, className }: WeaponSelectorUIProps) {
  const displayWeapons = weapons || [
    { slot: 'Primary', name: 'MK-18', ammo: 30, isActive: true },
    { slot: 'Secondary', name: 'Pistole', ammo: 15, isActive: false },
  ]
  return (
    <div className={`fixed top-1/2 right-8 transform -translate-y-1/2 z-10 ${className}`}>
      <div className="space-y-2">
        {displayWeapons.map((weapon, index) => (
          <div
            key={weapon.slot}
            className={`bg-black/70 backdrop-blur-sm rounded-lg p-3 border transition-all duration-200 ${
              weapon.isActive 
                ? 'border-yellow-400 bg-yellow-400/20' 
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">{weapon.slot}</div>
                  <div className={`font-bold ${weapon.isActive ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {weapon.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-mono ${
                    weapon.ammo <= 5 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {weapon.ammo}
                  </div>
                  <div className="text-xs text-gray-400">
                    {index + 1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}