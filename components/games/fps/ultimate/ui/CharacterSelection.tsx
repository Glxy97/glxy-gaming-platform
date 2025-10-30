'use client'

/**
 * 👤 CHARACTER SELECTION UI
 * 
 * Overwatch-style character selection screen
 * Shows all characters with abilities, stats, and unlocks
 */

import React, { useState, useEffect } from 'react'
import { ALL_CHARACTERS, getCharacterById, getCharacterClass } from '../characters/CharacterCatalog'
import type { PlayableCharacter } from '../types/CharacterTypes'
import { CharacterClass } from '../types/CharacterTypes'

interface CharacterSelectionProps {
  playerLevel: number
  onCharacterSelect: (character: PlayableCharacter) => void
  onClose: () => void
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  playerLevel,
  onCharacterSelect,
  onClose
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<PlayableCharacter | null>(null)
  const [filterClass, setFilterClass] = useState<CharacterClass | 'all'>('all')
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')

  // Filter characters
  const filteredCharacters = ALL_CHARACTERS.filter(char => {
    if (filterClass !== 'all' && getCharacterClass(char) !== filterClass) return false
    if (filterRarity !== 'all' && char.rarity !== filterRarity) return false
    return true
  })

  const handleSelect = (char: PlayableCharacter) => {
    setSelectedCharacter(char)
  }

  const handleConfirm = () => {
    if (selectedCharacter) {
      onCharacterSelect(selectedCharacter)
      onClose()
    }
  }

  const isLocked = (char: PlayableCharacter) => {
    return !char.isUnlocked && char.unlockLevel && char.unlockLevel > playerLevel
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>SELECT CHARACTER</h1>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label>Class:</label>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value as CharacterClass | 'all')}
              style={styles.select}
            >
              <option value="all">All Classes</option>
              <option value={CharacterClass.ASSAULT}>Assault</option>
              <option value={CharacterClass.TANK}>Tank</option>
              <option value={CharacterClass.SUPPORT}>Support</option>
              <option value={CharacterClass.RECON}>Recon</option>
              <option value={CharacterClass.SPECIALIST}>Specialist</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label>Rarity:</label>
            <select 
              value={filterRarity} 
              onChange={(e) => setFilterRarity(e.target.value as any)}
              style={styles.select}
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
        </div>

        {/* Character Grid */}
        <div style={styles.characterGrid}>
          {filteredCharacters.map(char => (
            <div
              key={char.id}
              style={{
                ...styles.characterCard,
                ...(selectedCharacter?.id === char.id ? styles.characterCardSelected : {}),
                ...(isLocked(char) ? styles.characterCardLocked : {})
              }}
              onClick={() => !isLocked(char) && handleSelect(char)}
            >
              {/* Locked Overlay */}
              {isLocked(char) && (
                <div style={styles.lockedOverlay}>
                  <div style={styles.lockIcon}>🔒</div>
                  <div style={styles.unlockText}>Level {char.unlockLevel}</div>
                </div>
              )}

              {/* Character Portrait */}
              <div style={styles.characterPortrait}>
                <div style={styles.characterInitial}>{char.name[0]}</div>
              </div>

              {/* Character Info */}
              <div style={styles.characterInfo}>
                <div style={styles.characterName}>{char.displayName}</div>
                <div style={styles.characterRarity}>
                  {getRarityEmoji(char.rarity)} {char.rarity.toUpperCase()}
                </div>
                <div style={styles.characterClass}>
                  {getClassIcon(getCharacterClass(char))} {getCharacterClass(char).toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Character Details Panel */}
        {selectedCharacter && (
          <div style={styles.detailsPanel}>
            <h2 style={styles.detailsTitle}>{selectedCharacter.displayName}</h2>
            <p style={styles.detailsDescription}>{selectedCharacter.description}</p>
            {selectedCharacter.lore && (
              <p style={styles.detailsLore}><em>{selectedCharacter.lore}</em></p>
            )}

            {/* Abilities */}
            <div style={styles.abilitiesSection}>
              <h3 style={styles.sectionTitle}>Abilities</h3>
              
              {/* Passive */}
              <div style={styles.abilityCard}>
                <div style={styles.abilityIcon}>🔹</div>
                <div style={styles.abilityInfo}>
                  <div style={styles.abilityName}>Passive: {selectedCharacter.abilities.passive.name}</div>
                  <div style={styles.abilityDescription}>{selectedCharacter.abilities.passive.description}</div>
                </div>
              </div>

              {/* Active */}
              <div style={styles.abilityCard}>
                <div style={styles.abilityIcon}>⚡</div>
                <div style={styles.abilityInfo}>
                  <div style={styles.abilityName}>Active: {selectedCharacter.abilities.active.name}</div>
                  <div style={styles.abilityDescription}>{selectedCharacter.abilities.active.description}</div>
                  <div style={styles.abilityCooldown}>Cooldown: {selectedCharacter.abilities.active.cooldown}s</div>
                </div>
              </div>

              {/* Ultimate */}
              <div style={styles.abilityCard}>
                <div style={styles.abilityIcon}>🌟</div>
                <div style={styles.abilityInfo}>
                  <div style={styles.abilityName}>Ultimate: {selectedCharacter.abilities.ultimate.name}</div>
                  <div style={styles.abilityDescription}>{selectedCharacter.abilities.ultimate.description}</div>
                  <div style={styles.abilityVoiceline}>"{selectedCharacter.abilities.ultimate.voiceLine}"</div>
                </div>
              </div>
            </div>

            {/* Stats Preview */}
            <div style={styles.statsSection}>
              <h3 style={styles.sectionTitle}>Stats</h3>
              <div style={styles.statsGrid}>
                <StatBar label="Health" value={selectedCharacter.stats.maxHealth} max={120} />
                <StatBar label="Armor" value={selectedCharacter.stats.maxArmor} max={100} />
                <StatBar label="Speed" value={selectedCharacter.stats.movementSpeed * 100} max={120} />
                <StatBar label="Damage" value={selectedCharacter.stats.damageMultiplier * 100} max={120} />
              </div>
            </div>

            {/* Confirm Button */}
            <button onClick={handleConfirm} style={styles.confirmButton}>
              SELECT {selectedCharacter.displayName}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Components
const StatBar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div style={styles.statBar}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statBarContainer}>
        <div style={{ ...styles.statBarFill, width: `${percentage}%` }} />
      </div>
      <div style={styles.statValue}>{value.toFixed(0)}</div>
    </div>
  )
}

// Helper Functions
function getRarityEmoji(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '🌟'
    case 'epic': return '💜'
    case 'rare': return '💙'
    case 'common': return '⚪'
    default: return '⚪'
  }
}

function getClassIcon(characterClass: CharacterClass): string {
  switch (characterClass) {
    case CharacterClass.ASSAULT: return '⚔️'
    case CharacterClass.TANK: return '🛡️'
    case CharacterClass.SUPPORT: return '❤️'
    case CharacterClass.RECON: return '👁️'
    case CharacterClass.SPECIALIST: return '🔧'
    default: return '❓'
  }
}

// Styles
const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '1400px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #00d4ff',
    paddingBottom: '15px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#00d4ff',
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '2px'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #ff4757',
    color: '#ff4757',
    fontSize: '24px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filters: {
    display: 'flex',
    gap: '20px',
    padding: '15px',
    backgroundColor: '#0f0f1e',
    borderRadius: '10px'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#fff'
  },
  select: {
    padding: '8px 15px',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    border: '1px solid #00d4ff',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  characterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px',
    padding: '10px',
    maxHeight: '400px',
    overflowY: 'auto' as const
  },
  characterCard: {
    position: 'relative' as const,
    backgroundColor: '#2a2a3e',
    borderRadius: '10px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid transparent'
  },
  characterCardSelected: {
    border: '2px solid #00d4ff',
    transform: 'scale(1.05)',
    boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
  },
  characterCardLocked: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  lockedOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '10px',
    zIndex: 1
  },
  lockIcon: {
    fontSize: '32px'
  },
  unlockText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: '5px'
  },
  characterPortrait: {
    width: '100%',
    aspectRatio: '1',
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10px'
  },
  characterInitial: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  characterInfo: {
    textAlign: 'center' as const
  },
  characterName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '5px'
  },
  characterRarity: {
    fontSize: '11px',
    color: '#aaa',
    marginBottom: '3px'
  },
  characterClass: {
    fontSize: '11px',
    color: '#00d4ff'
  },
  detailsPanel: {
    backgroundColor: '#0f0f1e',
    borderRadius: '15px',
    padding: '25px',
    border: '2px solid #00d4ff'
  },
  detailsTitle: {
    fontSize: '28px',
    color: '#00d4ff',
    marginBottom: '10px'
  },
  detailsDescription: {
    color: '#ccc',
    fontSize: '16px',
    marginBottom: '10px'
  },
  detailsLore: {
    color: '#999',
    fontSize: '14px',
    marginBottom: '20px'
  },
  abilitiesSection: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#fff',
    marginBottom: '15px',
    borderBottom: '1px solid #00d4ff',
    paddingBottom: '8px'
  },
  abilityCard: {
    display: 'flex',
    gap: '15px',
    padding: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    marginBottom: '10px'
  },
  abilityIcon: {
    fontSize: '32px'
  },
  abilityInfo: {
    flex: 1
  },
  abilityName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: '5px'
  },
  abilityDescription: {
    fontSize: '14px',
    color: '#ccc'
  },
  abilityCooldown: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px'
  },
  abilityVoiceline: {
    fontSize: '13px',
    color: '#ffaa00',
    fontStyle: 'italic' as const,
    marginTop: '5px'
  },
  statsSection: {
    marginBottom: '20px'
  },
  statsGrid: {
    display: 'grid',
    gap: '10px'
  },
  statBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statLabel: {
    minWidth: '80px',
    color: '#ccc',
    fontSize: '14px'
  },
  statBarContainer: {
    flex: 1,
    height: '20px',
    backgroundColor: '#2a2a3e',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    transition: 'width 0.3s'
  },
  statValue: {
    minWidth: '40px',
    textAlign: 'right' as const,
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  confirmButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase' as const
  }
}

