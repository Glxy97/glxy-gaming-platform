// @ts-nocheck
'use client';

import React from 'react';
import { Heart, Shield } from 'lucide-react';

interface HealthBarProps {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
}

export function HealthBar({ health, maxHealth, armor, maxArmor }: HealthBarProps) {
  const healthPercentage = (health / maxHealth) * 100;
  const armorPercentage = armor > 0 ? (armor / maxArmor) * 100 : 0;

  const getHealthColor = (percentage: number) => {
    if (percentage > 60) return 'text-green-400';
    if (percentage > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBarColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
      {/* Health Bar */}
      <div className="flex items-center space-x-2 mb-2">
        <Heart className={`w-5 h-5 ${getHealthColor(healthPercentage)}`} />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>HEALTH</span>
            <span className={getHealthColor(healthPercentage)}>{health}/{maxHealth}</span>
          </div>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getHealthBarColor(healthPercentage)} transition-all duration-300 ease-out`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Armor Bar */}
      {armor > 0 && (
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>ARMOR</span>
              <span className="text-blue-400">{armor}/{maxArmor}</span>
            </div>
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${armorPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Low Health Warning */}
      {healthPercentage <= 25 && (
        <div className="mt-2 text-red-400 text-xs font-semibold animate-pulse">
          ⚠️ LOW HEALTH
        </div>
      )}
    </div>
  );
}