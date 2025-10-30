/**
 * 🏆 LEADERBOARD UI
 * 
 * Global Rankings & Statistics
 */

'use client'

import React, { useState } from 'react'
import type { WeaponProgression } from '../types/WeaponProgressionTypes'
import type { PlayableCharacter } from '../types/CharacterTypes'
import { WeaponProgressionManager } from '../progression/WeaponProgressionManager'

interface LeaderboardUIProps {
  weaponProgressionManager: WeaponProgressionManager
  playerLevel: number
  playerStats: {
    kills: number
    deaths: number
    headshots: number
    accuracy: number
    score: number
    longestStreak: number
  }
  onClose: () => void
}

export const LeaderboardUI: React.FC<LeaderboardUIProps> = ({
  weaponProgressionManager,
  playerLevel,
  playerStats,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'weapons' | 'characters' | 'global'>('weapons')

  const allWeaponStats = weaponProgressionManager.getAllProgressions()
  const totalStats = weaponProgressionManager.getTotalStats()

  // Sort weapons by level
  const topWeapons = [...allWeaponStats]
    .sort((a, b) => b.level - a.level || b.kills - a.kills)
    .slice(0, 10)

  // Calculate KD ratio
  const kdRatio = playerStats.deaths > 0 ? (playerStats.kills / playerStats.deaths).toFixed(2) : playerStats.kills.toFixed(2)

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
        background: 'linear-gradient(90deg, rgba(0,255,255,0.2) 0%, rgba(255,215,0,0.2) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', textShadow: '0 0 10px #00ffff' }}>
            🏆 LEADERBOARDS
          </h1>
          <p style={{ margin: '10px 0 0', opacity: 0.8 }}>
            Player Level: {playerLevel} • Prestige: 0
          </p>
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '0 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {(['weapons', 'characters', 'global'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              padding: '15px 30px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: selectedTab === tab ? 'rgba(0, 255, 255, 0.3)' : 'transparent',
              color: selectedTab === tab ? '#00ffff' : '#fff',
              border: 'none',
              borderBottom: selectedTab === tab ? '2px solid #00ffff' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => selectedTab !== tab && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseLeave={(e) => selectedTab !== tab && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {tab === 'weapons' && '🔫'} {tab === 'characters' && '👤'} {tab === 'global' && '🌐'} {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {selectedTab === 'weapons' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#00ffff' }}>🔫 TOP WEAPONS</h2>

            {/* Weapon Rankings */}
            <div style={{ marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', opacity: 0.7 }}>RANK</th>
                    <th style={{ padding: '15px', textAlign: 'left', opacity: 0.7 }}>WEAPON</th>
                    <th style={{ padding: '15px', textAlign: 'center', opacity: 0.7 }}>LEVEL</th>
                    <th style={{ padding: '15px', textAlign: 'center', opacity: 0.7 }}>KILLS</th>
                    <th style={{ padding: '15px', textAlign: 'center', opacity: 0.7 }}>ACCURACY</th>
                    <th style={{ padding: '15px', textAlign: 'center', opacity: 0.7 }}>MASTERY</th>
                  </tr>
                </thead>
                <tbody>
                  {topWeapons.map((weapon, index) => (
                    <tr
                      key={weapon.weaponId}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : index < 3 ? 'rgba(0, 255, 255, 0.05)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>
                        {weapon.weaponId.toUpperCase()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#00ffff', fontWeight: 'bold', fontSize: '18px' }}>
                        {weapon.level}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {weapon.kills}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {weapon.accuracy.toFixed(1)}%
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        {weapon.masteryLevel === 'gold' && '🥇'}
                        {weapon.masteryLevel === 'platinum' && '💿'}
                        {weapon.masteryLevel === 'diamond' && '💎'}
                        {weapon.masteryLevel === 'obsidian' && '⚫'}
                        {' '}
                        {weapon.masteryLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Stats */}
            <h3 style={{ margin: '30px 0 15px', color: '#00ffff' }}>📊 TOTAL WEAPON STATS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '4px solid #00ffff',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>TOTAL KILLS</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ffff' }}>
                  {totalStats.totalKills}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '4px solid #ff0000',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>TOTAL HEADSHOTS</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff0000' }}>
                  {totalStats.totalHeadshots}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '4px solid #00ff00',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>AVG ACCURACY</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff00' }}>
                  {totalStats.averageAccuracy.toFixed(1)}%
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '4px solid #ffd700',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>MAX LEVEL WEAPONS</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd700' }}>
                  {totalStats.weaponsMaxLevel}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '4px solid #ff00ff',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>HIGHEST LEVEL</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff00ff' }}>
                  {totalStats.maxLevel}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'characters' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#00ffff' }}>👤 CHARACTER STATS</h2>
            <div style={{
              padding: '30px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              textAlign: 'center',
              opacity: 0.7
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
              <div style={{ fontSize: '18px' }}>CHARACTER STATISTICS COMING SOON</div>
              <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.6 }}>
                Track your performance with each character
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'global' && (
          <div>
            <h2 style={{ margin: '0 0 20px', color: '#00ffff' }}>🌐 GLOBAL STATS</h2>

            {/* Personal Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid #00ffff',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>K/D RATIO</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00ffff' }}>
                  {kdRatio}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '2px solid #ff0000',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>TOTAL KILLS</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff0000' }}>
                  {playerStats.kills}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '2px solid #ffd700',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>HEADSHOTS</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd700' }}>
                  {playerStats.headshots}
                </div>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                border: '2px solid #00ff00',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>ACCURACY</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00ff00' }}>
                  {playerStats.accuracy.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Achievements */}
            <h3 style={{ margin: '30px 0 15px', color: '#00ffff' }}>🏅 ACHIEVEMENTS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              {[
                { icon: '🎯', name: 'Sharpshooter', desc: 'Get 100 headshots', unlocked: playerStats.headshots >= 100 },
                { icon: '💀', name: 'Assassin', desc: 'Get 500 kills', unlocked: playerStats.kills >= 500 },
                { icon: '🔥', name: 'Hot Streak', desc: '10 kill streak', unlocked: playerStats.longestStreak >= 10 },
                { icon: '🎖️', name: 'Veteran', desc: 'Reach level 25', unlocked: playerLevel >= 25 },
                { icon: '💎', name: 'Diamond', desc: 'Get diamond camo', unlocked: totalStats.maxLevel >= 50 },
                { icon: '👑', name: 'Legend', desc: 'Reach level 50', unlocked: playerLevel >= 50 }
              ].map((achievement, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    backgroundColor: achievement.unlocked ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                    border: `2px solid ${achievement.unlocked ? '#ffd700' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    opacity: achievement.unlocked ? 1 : 0.5
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{achievement.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {achievement.name}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {achievement.desc}
                  </div>
                  {achievement.unlocked && (
                    <div style={{
                      marginTop: '10px',
                      padding: '5px',
                      backgroundColor: 'rgba(255, 215, 0, 0.3)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#ffd700'
                    }}>
                      ✓ UNLOCKED
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardUI

