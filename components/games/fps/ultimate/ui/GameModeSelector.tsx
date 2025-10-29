/**
 * Game Mode Selector Component
 * 
 * @module GameModeSelector
 * @description Professional UI for selecting game modes
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

'use client'

import { useState } from 'react'
import type { GameMode } from '../types/GameTypes'

// ============================================================================
// INTERFACES
// ============================================================================

interface GameModeSelectorProps {
  /** Current game mode */
  currentMode: GameMode
  
  /** Available game modes */
  availableModes: GameMode[]
  
  /** Callback when mode changes */
  onModeChange: (mode: GameMode) => void
  
  /** Optional: Disable mode selection */
  disabled?: boolean
}

interface ModeMetadata {
  name: string
  description: string
  icon: string
  minPlayers: number
  maxPlayers: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  color: string
}

// ============================================================================
// MODE METADATA (Professionell definiert!)
// ============================================================================

const MODE_METADATA: Record<GameMode, ModeMetadata> = {
  'zombie': {
    name: 'Zombie Survival',
    description: 'Survive waves of increasingly difficult zombies',
    icon: '🧟',
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'Easy',
    color: 'bg-green-500'
  },
  'team-deathmatch': {
    name: 'Team Deathmatch',
    description: '2 teams fight to reach the score limit first',
    icon: '⚔️',
    minPlayers: 2,
    maxPlayers: 16,
    difficulty: 'Medium',
    color: 'bg-blue-500'
  },
  'free-for-all': {
    name: 'Free For All',
    description: 'Every player for themselves - last one standing wins',
    icon: '🔫',
    minPlayers: 2,
    maxPlayers: 8,
    difficulty: 'Medium',
    color: 'bg-red-500'
  },
  'gun-game': {
    name: 'Gun Game',
    description: 'Progress through weapons - first to final weapon wins',
    icon: '🎯',
    minPlayers: 2,
    maxPlayers: 8,
    difficulty: 'Hard',
    color: 'bg-purple-500'
  },
  'search-destroy': {
    name: 'Search & Destroy',
    description: 'Plant or defuse the bomb to win rounds',
    icon: '💣',
    minPlayers: 2,
    maxPlayers: 10,
    difficulty: 'Expert',
    color: 'bg-orange-500'
  },
  'capture-flag': {
    name: 'Capture the Flag',
    description: 'Capture enemy flag and return it to your base',
    icon: '🚩',
    minPlayers: 4,
    maxPlayers: 16,
    difficulty: 'Hard',
    color: 'bg-yellow-500'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * GameModeSelector Component
 * 
 * @remarks
 * NACHDENKEN: Was braucht eine gute Mode Selection?
 * - Visuell ansprechend
 * - Klar ersichtlich welcher Mode aktiv ist
 * - Info über jeden Mode
 * - Easy to click
 * 
 * PROFESSIONELL: Responsive Grid Layout mit Cards
 */
export function GameModeSelector({
  currentMode,
  availableModes,
  onModeChange,
  disabled = false
}: GameModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null)
  
  /**
   * INTELLIGENT: Handle mode selection
   */
  const handleModeSelect = (mode: GameMode) => {
    if (disabled) return
    if (mode === currentMode) return // Already selected
    
    onModeChange(mode)
  }
  
  /**
   * KORREKT: Get difficulty color
   */
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400'
      case 'Medium': return 'text-yellow-400'
      case 'Hard': return 'text-orange-400'
      case 'Expert': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }
  
  /**
   * LOGISCH: Filter available modes
   */
  const visibleModes = availableModes.filter(mode => MODE_METADATA[mode])
  
  return (
    <div className="w-full">
      {/* PROFESSIONELL: Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎮 Select Game Mode
        </h2>
        <p className="text-gray-400 text-sm">
          Choose your favorite game mode to start playing
        </p>
      </div>
      
      {/* INTELLIGENT: Grid Layout - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModes.map((mode) => {
          const metadata = MODE_METADATA[mode]
          const isActive = mode === currentMode
          const isHovered = mode === hoveredMode
          
          return (
            <button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              onMouseEnter={() => setHoveredMode(mode)}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={disabled}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300
                ${isActive 
                  ? 'border-white bg-white/10 scale-105' 
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:scale-102'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isHovered && !isActive ? 'shadow-lg shadow-gray-500/20' : ''}
              `}
            >
              {/* RICHTIG: Active Indicator */}
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    <span>✓</span>
                    <span>ACTIVE</span>
                  </div>
                </div>
              )}
              
              {/* PROFESSIONELL: Mode Icon */}
              <div className="text-6xl mb-3 text-center">
                {metadata.icon}
              </div>
              
              {/* KORREKT: Mode Name */}
              <h3 className="text-xl font-bold text-white mb-2 text-center">
                {metadata.name}
              </h3>
              
              {/* LOGISCH: Mode Description */}
              <p className="text-sm text-gray-400 text-center mb-4 h-12">
                {metadata.description}
              </p>
              
              {/* INTELLIGENT: Mode Info */}
              <div className="space-y-2">
                {/* Players */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Players:</span>
                  <span className="text-white font-semibold">
                    {metadata.minPlayers === metadata.maxPlayers 
                      ? metadata.maxPlayers 
                      : `${metadata.minPlayers}-${metadata.maxPlayers}`}
                  </span>
                </div>
                
                {/* Difficulty */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Difficulty:</span>
                  <span className={`font-semibold ${getDifficultyColor(metadata.difficulty)}`}>
                    {metadata.difficulty}
                  </span>
                </div>
              </div>
              
              {/* RICHTIG: Hover Effect */}
              {isHovered && !isActive && (
                <div className="absolute inset-0 bg-white/5 rounded-xl pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>
      
      {/* PROFESSIONELL: Current Mode Info */}
      <div className="mt-6 p-4 bg-gray-900/80 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {MODE_METADATA[currentMode].icon}
          </div>
          <div className="flex-1">
            <div className="text-white font-bold">
              Currently Playing: {MODE_METADATA[currentMode].name}
            </div>
            <div className="text-sm text-gray-400">
              {MODE_METADATA[currentMode].description}
            </div>
          </div>
        </div>
      </div>
      
      {/* INTELLIGENT: Disabled State Info */}
      {disabled && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-yellow-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>Mode selection is disabled during active game</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * PROFESSIONELL: Compact Mode Selector (für HUD)
 */
export function CompactGameModeSelector({
  currentMode,
  availableModes,
  onModeChange,
  disabled = false
}: GameModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      {/* LOGISCH: Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg border-2 transition-all
          ${disabled 
            ? 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed' 
            : 'border-gray-600 bg-gray-800 hover:border-gray-400'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{MODE_METADATA[currentMode].icon}</span>
          <span className="text-white text-sm font-semibold">
            {MODE_METADATA[currentMode].name}
          </span>
          <span className="text-gray-400 text-xs">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>
      
      {/* INTELLIGENT: Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl z-50">
          {availableModes.map((mode) => {
            const metadata = MODE_METADATA[mode]
            const isActive = mode === currentMode
            
            return (
              <button
                key={mode}
                onClick={() => {
                  handleModeSelect(mode)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 transition-colors
                  ${isActive 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                <span className="text-2xl">{metadata.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white text-sm font-semibold">
                    {metadata.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {metadata.minPlayers}-{metadata.maxPlayers} Players
                  </div>
                </div>
                {isActive && (
                  <span className="text-green-400">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
  
  function handleModeSelect(mode: GameMode) {
    if (disabled) return
    if (mode === currentMode) return
    onModeChange(mode)
  }
}

/**
 * EXPORT: Named Exports für Tree Shaking
 */
export { GameMode, MODE_METADATA }
export type { GameModeSelectorProps, ModeMetadata }

