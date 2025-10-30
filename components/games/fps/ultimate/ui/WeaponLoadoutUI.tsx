/**
 * 🔫 WEAPON LOADOUT UI
 * 
 * CoD-Style Weapon Customization Screen
 */

'use client'

import React, { useState } from 'react'
import type { WeaponProgression } from '../types/WeaponProgressionTypes'
import { WeaponProgressionManager } from '../progression/WeaponProgressionManager'

interface WeaponLoadoutUIProps {
  weaponProgressionManager: WeaponProgressionManager
  availableWeapons: string[] // Weapon IDs
  onClose: () => void
}

export const WeaponLoadoutUI: React.FC<WeaponLoadoutUIProps> = ({
  weaponProgressionManager,
  availableWeapons,
  onClose
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(availableWeapons[0] || null)
  const [selectedTab, setSelectedTab] = useState<'stats' | 'attachments' | 'skins'>('stats')

  if (!selectedWeapon) return null

  const progression = weaponProgressionManager.getProgression(selectedWeapon)
  const xpPercent = (progression.currentXP / progression.nextLevelXP) * 100

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'obsidian': return '#1a1a1a'
      case 'diamond': return '#b9f2ff'
      case 'platinum': return '#e5e4e2'
      case 'gold': return '#ffd700'
      case 'silver': return '#c0c0c0'
      default: return '#cd7f32'
    }
  }

  const getMasteryIcon = (mastery: string) => {
    switch (mastery) {
      case 'obsidian': return '⚫'
      case 'diamond': return '💎'
      case 'platinum': return '💿'
      case 'gold': return '🥇'
      case 'silver': return '🥈'
      default: return '🥉'
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
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Left Sidebar - Weapon List */}
      <div style={{
        width: '250px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRight: '2px solid #ff9500',
        overflowY: 'auto',
        padding: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: '#ff9500' }}>
          🔫 MY WEAPONS
        </h2>

        {availableWeapons.map((weaponId) => {
          const prog = weaponProgressionManager.getProgression(weaponId)
          const isSelected = selectedWeapon === weaponId

          return (
            <div
              key={weaponId}
              onClick={() => setSelectedWeapon(weaponId)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isSelected ? '#ff9500' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                {weaponId.toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                Level {prog.level} • {prog.kills} Kills
              </div>
              <div style={{
                marginTop: '6px',
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(prog.currentXP / prog.nextLevelXP) * 100}%`,
                  backgroundColor: '#ff9500',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #ff9500',
          background: 'linear-gradient(90deg, rgba(255,149,0,0.2) 0%, rgba(255,0,149,0.2) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', textShadow: '0 0 10px #ff9500' }}>
                {selectedWeapon.toUpperCase()}
              </h1>
              <div style={{ marginTop: '10px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9500' }}>
                  LEVEL {progression.level}
                </div>
                <div style={{ flex: 1, maxWidth: '300px' }}>
                  <div style={{
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${xpPercent}%`,
                      backgroundColor: '#ff9500',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 10px #ff9500'
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                    {progression.currentXP} / {progression.nextLevelXP} XP
                  </div>
                </div>
                <div style={{
                  fontSize: '24px',
                  color: getMasteryColor(progression.masteryLevel),
                  textShadow: `0 0 10px ${getMasteryColor(progression.masteryLevel)}`
                }}>
                  {getMasteryIcon(progression.masteryLevel)} {progression.masteryLevel.toUpperCase()}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
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
              ✖ CLOSE
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          padding: '0 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {(['stats', 'attachments', 'skins'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '15px 30px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: selectedTab === tab ? 'rgba(255, 149, 0, 0.3)' : 'transparent',
                color: selectedTab === tab ? '#ff9500' : '#fff',
                border: 'none',
                borderBottom: selectedTab === tab ? '2px solid #ff9500' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => selectedTab !== tab && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
              onMouseLeave={(e) => selectedTab !== tab && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {tab === 'stats' && '📊'} {tab === 'attachments' && '🔧'} {tab === 'skins' && '🎨'} {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {selectedTab === 'stats' && (
            <div>
              <h2 style={{ margin: '0 0 20px', color: '#ff9500' }}>📊 WEAPON STATISTICS</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {/* Kills */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #ff9500',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>TOTAL KILLS</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9500' }}>
                    {progression.kills}
                  </div>
                </div>

                {/* Headshots */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #ff0000',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>HEADSHOTS</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff0000' }}>
                    {progression.headshots}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>
                    {progression.kills > 0 ? ((progression.headshots / progression.kills) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>

                {/* Accuracy */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #00ff00',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>ACCURACY</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff00' }}>
                    {progression.accuracy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>
                    {progression.shotsHit} / {progression.totalShots} shots
                  </div>
                </div>

                {/* Longest Kill */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #00ffff',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>LONGEST KILL</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ffff' }}>
                    {progression.longestKillDistance.toFixed(0)}m
                  </div>
                </div>

                {/* Kill Streak */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #ff00ff',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>BEST STREAK</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff00ff' }}>
                    {progression.killStreak}
                  </div>
                </div>

                {/* Multikills */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderLeft: '4px solid #ffff00',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>MULTIKILLS</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffff00' }}>
                    {progression.multikills}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'attachments' && (
            <div>
              <h2 style={{ margin: '0 0 20px', color: '#ff9500' }}>🔧 ATTACHMENTS</h2>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>
                  UNLOCKED ATTACHMENTS: {progression.unlockedAttachments.length}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  {progression.unlockedAttachments.map((attachmentId, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '15px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 149, 0, 0.3)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        🔧 {attachmentId}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        Level {(index + 1) * 5} Unlock
                      </div>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, 8 - progression.unlockedAttachments.length) }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      style={{
                        padding: '15px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                      }}
                    >
                      <div style={{ fontSize: '32px' }}>🔒</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'skins' && (
            <div>
              <h2 style={{ margin: '0 0 20px', color: '#ff9500' }}>🎨 WEAPON SKINS</h2>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>
                  UNLOCKED SKINS: {progression.unlockedSkins.length}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  {progression.unlockedSkins.map((skinId) => (
                    <div
                      key={skinId}
                      style={{
                        padding: '15px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '2px solid #ffd700',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <div style={{
                        height: '80px',
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        fontSize: '32px'
                      }}>
                        🎨
                      </div>
                      <div style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {skinId}
                      </div>
                    </div>
                  ))}

                  {/* Locked Skins */}
                  {['Level 20', 'Level 30', 'Level 40 (GOLD)', 'Level 50 (DIAMOND)'].map((label, index) => {
                    const isUnlocked = progression.level >= (index + 2) * 10
                    return !isUnlocked && (
                      <div
                        key={label}
                        style={{
                          padding: '15px',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          border: '1px dashed rgba(255, 255, 255, 0.2)',
                          borderRadius: '4px',
                          opacity: 0.5
                        }}
                      >
                        <div style={{
                          height: '80px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '5px' }}>🔒</div>
                        </div>
                        <div style={{ fontSize: '11px', textAlign: 'center', opacity: 0.7 }}>
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeaponLoadoutUI

