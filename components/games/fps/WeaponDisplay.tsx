// @ts-nocheck
'use client';

import React from 'react';
import { Shield, Zap } from 'lucide-react';

interface WeaponDisplayProps {
  currentWeapon: string;
  ammo: number;
  maxAmmo?: number;
  isReloading?: boolean;
  weapons?: string[];
}

export const WeaponDisplay: React.FC<WeaponDisplayProps> = ({
  currentWeapon,
  ammo,
  maxAmmo = 30,
  isReloading = false,
  weapons = ['Assault Rifle', 'Pistol', 'Schwert']
}) => {
  const getWeaponIcon = (weapon: string) => {
    switch (weapon) {
      case 'Assault Rifle':
        return '🔫';
      case 'Pistol':
        return '🔪';
      case 'Schwert':
        return '⚔️';
      default:
        return '🔫';
    }
  };

  const getWeaponColor = (weapon: string) => {
    switch (weapon) {
      case 'Assault Rifle':
        return 'text-blue-400';
      case 'Pistol':
        return 'text-yellow-400';
      case 'Schwert':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="absolute bottom-4 right-4 pointer-events-none z-10">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-600 shadow-xl">
        {/* Current Weapon */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getWeaponIcon(currentWeapon)}</span>
            <div>
              <div className={`text-lg font-bold ${getWeaponColor(currentWeapon)}`}>
                {currentWeapon}
              </div>
              {isReloading && (
                <div className="text-xs text-yellow-400 animate-pulse">
                  RELOADING...
                </div>
              )}
            </div>
          </div>
          
          {/* Ammo Display */}
          {currentWeapon !== 'Schwert' && (
            <div className="text-right">
              <div className="text-2xl font-mono text-white">
                {ammo}
              </div>
              <div className="text-xs text-gray-400">
                / {maxAmmo}
              </div>
            </div>
          )}
          
          {currentWeapon === 'Schwert' && (
            <div className="text-right">
              <div className="text-2xl font-mono text-green-400">
                ∞
              </div>
              <div className="text-xs text-gray-400">
                UNLIMITED
              </div>
            </div>
          )}
        </div>

        {/* Weapon Switch Display */}
        <div className="border-t border-gray-600 pt-3">
          <div className="text-xs text-gray-400 mb-2">WEAPONS</div>
          <div className="grid grid-cols-3 gap-2">
            {weapons.map((weapon, index) => (
              <div
                key={weapon}
                className={`p-2 rounded text-center transition-all ${
                  weapon === currentWeapon
                    ? 'bg-blue-600/50 border border-blue-400'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="text-lg mb-1">{getWeaponIcon(weapon)}</div>
                <div className={`text-xs font-medium ${
                  weapon === currentWeapon ? 'text-white' : 'text-gray-400'
                }`}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ammo Bar for non-melee weapons */}
        {currentWeapon !== 'Schwert' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>AMMO</span>
              <span>{Math.round((ammo / maxAmmo) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(ammo / maxAmmo) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};