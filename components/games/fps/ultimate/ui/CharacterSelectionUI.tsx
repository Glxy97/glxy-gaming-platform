/**
 * 👤 CHARACTER SELECTION UI
 * 
 * Overwatch-style Character Selection Screen
 */

'use client'

import React, { useState, useEffect } from 'react'
import * as THREE from 'three'
import { ALL_CHARACTERS, getCharacterClass } from '../characters/CharacterCatalog'
import type { PlayableCharacter } from '../types/CharacterTypes'
import { CharacterClass } from '../types/CharacterTypes'

interface CharacterSelectionUIProps {
  playerLevel: number
  onSelect: (character: PlayableCharacter) => void
  onClose: () => void
  initialCharacter?: PlayableCharacter
}

export const CharacterSelectionUI: React.FC<CharacterSelectionUIProps> = ({
  playerLevel,
  onSelect,
  onClose,
  initialCharacter
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<PlayableCharacter>(
    initialCharacter || ALL_CHARACTERS[0]
  )
  const [hoveredCharacter, setHoveredCharacter] = useState<PlayableCharacter | null>(null)
  const [filterClass, setFilterClass] = useState<CharacterClass | 'all'>('all')
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')

  // Filter characters
  const filteredCharacters = ALL_CHARACTERS.filter(char => {
    const matchClass = filterClass === 'all' || getCharacterClass(char) === filterClass
    const matchRarity = filterRarity === 'all' || char.rarity === filterRarity
    return matchClass && matchRarity
  })

  const handleSelect = () => {
    onSelect(selectedCharacter)
    onClose()
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ff9500'
      case 'epic': return '#a335ee'
      case 'rare': return '#0070dd'
      case 'common': return '#ffffff'
      default: return '#9d9d9d'
    }
  }

  const getClassIcon = (charClass: CharacterClass) => {
    switch (charClass) {
      case CharacterClass.ASSAULT: return '⚔️'
      case CharacterClass.TANK: return '🛡️'
      case CharacterClass.SUPPORT: return '❤️'
      case CharacterClass.RECON: return '👁️'
      case CharacterClass.SPECIALIST: return '⭐'
      default: return '🎮'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #00ffff',
        background: 'linear-gradient(90deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', textShadow: '0 0 10px #00ffff' }}>
          👤 CHARACTER SELECTION
        </h1>
        <p style={{ margin: '10px 0 0', opacity: 0.8 }}>
          Choose your character • Player Level: {playerLevel}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '15px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Class Filter */}
        <div>
          <label style={{ fontSize: '12px', opacity: 0.7, marginRight: '10px' }}>CLASS:</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value as any)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #00ffff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Classes</option>
            <option value={CharacterClass.ASSAULT}>⚔️ Assault</option>
            <option value={CharacterClass.TANK}>🛡️ Tank</option>
            <option value={CharacterClass.SUPPORT}>❤️ Support</option>
            <option value={CharacterClass.RECON}>👁️ Recon</option>
            <option value={CharacterClass.SPECIALIST}>⭐ Specialist</option>
          </select>
        </div>

        {/* Rarity Filter */}
        <div>
          <label style={{ fontSize: '12px', opacity: 0.7, marginRight: '10px' }}>RARITY:</label>
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as any)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #00ffff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Rarities</option>
            <option value="legendary" style={{ color: '#ff9500' }}>Legendary</option>
            <option value="epic" style={{ color: '#a335ee' }}>Epic</option>
            <option value="rare" style={{ color: '#0070dd' }}>Rare</option>
            <option value="common">Common</option>
          </select>
        </div>
      </div>

      {/* Character Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
        padding: '20px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 400px)'
      }}>
        {filteredCharacters.map((char) => {
          const isLocked = char.unlockLevel !== undefined && char.unlockLevel > playerLevel
          const isSelected = selectedCharacter.id === char.id
          const isHovered = hoveredCharacter?.id === char.id
          const charClass = getCharacterClass(char)

          return (
            <div
              key={char.id}
              onMouseEnter={() => setHoveredCharacter(char)}
              onMouseLeave={() => setHoveredCharacter(null)}
              onClick={() => !isLocked && setSelectedCharacter(char)}
              style={{
                padding: '15px',
                backgroundColor: isSelected ? 'rgba(0, 255, 255, 0.3)' : isHovered ? 'rgba(0, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${isSelected ? '#00ffff' : getRarityColor(char.rarity)}`,
                borderRadius: '8px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: isSelected ? 'scale(1.05)' : isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? `0 0 20px ${getRarityColor(char.rarity)}` : 'none'
              }}
            >
              {/* Locked Overlay */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  zIndex: 1
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '5px' }}>🔒</div>
                  <div style={{ fontSize: '12px' }}>Level {char.unlockLevel} Required</div>
                </div>
              )}

              {/* Class Icon */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '24px',
                filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.8))'
              }}>
                {getClassIcon(charClass)}
              </div>

              {/* Character Icon/Portrait */}
              <div style={{
                width: '100%',
                height: '120px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                border: `1px solid ${getRarityColor(char.rarity)}`
              }}>
                👤
              </div>

              {/* Character Name */}
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: getRarityColor(char.rarity),
                textShadow: `0 0 10px ${getRarityColor(char.rarity)}`,
                marginBottom: '5px'
              }}>
                {char.displayName}
              </div>

              {/* Stats Bar */}
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>
                <div>HP: {char.stats.maxHealth}</div>
                <div>Speed: {(char.stats.movementSpeed * 100).toFixed(0)}%</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Character Details */}
      {selectedCharacter && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTop: '2px solid #00ffff',
          display: 'flex',
          gap: '30px'
        }}>
          {/* Left: Character Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 10px',
              color: getRarityColor(selectedCharacter.rarity),
              textShadow: `0 0 10px ${getRarityColor(selectedCharacter.rarity)}`
            }}>
              {selectedCharacter.displayName}
            </h2>
            <p style={{ margin: '0 0 15px', opacity: 0.8, fontSize: '14px' }}>
              {selectedCharacter.description}
            </p>

            {/* Abilities */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>ABILITIES:</div>
              
              {/* Passive */}
              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(100, 100, 100, 0.3)',
                borderLeft: '3px solid #888',
                marginBottom: '5px'
              }}>
                <strong>⚡ Passive:</strong> {selectedCharacter.abilities.passive.name}
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {selectedCharacter.abilities.passive.description}
                </div>
              </div>

              {/* Active */}
              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(0, 150, 255, 0.2)',
                borderLeft: '3px solid #0096ff',
                marginBottom: '5px'
              }}>
                <strong>🔵 Active:</strong> {selectedCharacter.abilities.active.name}
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {selectedCharacter.abilities.active.description}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '3px' }}>
                  Cooldown: {selectedCharacter.abilities.active.cooldown}s
                </div>
              </div>

              {/* Ultimate */}
              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(255, 150, 0, 0.2)',
                borderLeft: '3px solid #ff9500',
                marginBottom: '5px'
              }}>
                <strong>🌟 Ultimate:</strong> {selectedCharacter.abilities.ultimate.name}
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {selectedCharacter.abilities.ultimate.description}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '3px' }}>
                  Charge Required: {selectedCharacter.abilities.ultimate.chargeRequired}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleSelect}
              disabled={selectedCharacter.unlockLevel !== undefined && selectedCharacter.unlockLevel > playerLevel}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: '#00ffff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              SELECT
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '10px 30px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CharacterSelectionUI

