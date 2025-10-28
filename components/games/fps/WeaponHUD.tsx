// @ts-nocheck
'use client'

import React from 'react'

interface WeaponHUDProps {
  weaponDef?: any
  weaponState?: any
  slotName?: string
  weaponName?: string
  ammo?: {
    current: number
    total: number
    isReloading: boolean
  }
  className?: string
}

export function WeaponHUD({ weaponName, ammo, weaponDef, className }: WeaponHUDProps) {
  const name = weaponName || weaponDef?.name || 'Unknown Weapon'
  const ammoStatus = ammo || weaponDef?.ammo || { current: 0, total: 0, isReloading: false }
  return (
    <div className={`fixed bottom-8 right-8 z-10 ${className}`}>
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
        <div className="text-white">
          {/* Weapon Name */}
          <div className="text-lg font-bold mb-2 text-yellow-400">
            {name}
          </div>
          
          {/* Ammo Display */}
          <div className="text-3xl font-mono font-bold">
            {ammoStatus.isReloading ? (
              <span className="text-yellow-400">RELOADING...</span>
            ) : (
              <span className={ammoStatus.current <= 5 ? 'text-red-400' : 'text-green-400'}>
                {ammoStatus.current}
              </span>
            )}
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-400">{ammoStatus.total}</span>
          </div>
          
          {/* Ammo Bar */}
          <div className="mt-2 w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                ammoStatus.isReloading ? 'bg-yellow-400' : 
                ammoStatus.current <= 5 ? 'bg-red-400' : 'bg-green-400'
              }`}
              style={{ 
                width: `${ammoStatus.isReloading ? '100%' : (ammoStatus.current / 30) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}