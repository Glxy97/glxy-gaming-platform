/**
 * 🎮 IN-GAME MENU UI (ESC)
 * 
 * Pause Menu during gameplay
 */

'use client'

import React, { useState } from 'react'

interface InGameMenuUIProps {
  onResume: () => void
  onLoadout: () => void
  onCharacterSelect: () => void
  onSettings: () => void
  onLeaveMatch: () => void
  matchTime: number
  kills: number
  deaths: number
  score: number
}

export const InGameMenuUI: React.FC<InGameMenuUIProps> = ({
  onResume,
  onLoadout,
  onCharacterSelect,
  onSettings,
  onLeaveMatch,
  matchTime,
  kills,
  deaths,
  score
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  const menuItems = [
    { id: 'resume', label: 'RESUME', icon: '▶️', onClick: onResume, color: '#00ff00' },
    { id: 'loadout', label: 'LOADOUT', icon: '🔫', onClick: onLoadout, color: '#ff9500' },
    { id: 'character', label: 'CHANGE CHARACTER', icon: '👤', onClick: onCharacterSelect, color: '#ff00ff' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙️', onClick: onSettings, color: '#888888' },
    { id: 'leave', label: 'LEAVE MATCH', icon: '🚪', onClick: () => setShowConfirmLeave(true), color: '#ff0000' }
  ]

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Confirm Leave Dialog */}
      {showConfirmLeave && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            padding: '40px',
            backgroundColor: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #ff0000',
            borderRadius: '12px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(255, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 15px', fontSize: '24px', color: '#ff0000' }}>
              LEAVE MATCH?
            </h2>
            <p style={{ margin: '0 0 30px', opacity: 0.8, fontSize: '16px' }}>
              Your progress will be lost. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={onLeaveMatch}
                style={{
                  padding: '15px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                YES, LEAVE
              </button>
              <button
                onClick={() => setShowConfirmLeave(false)}
                style={{
                  padding: '15px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 10px',
            fontSize: '42px',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
            color: '#00ffff',
            letterSpacing: '3px'
          }}>
            PAUSED
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '14px', letterSpacing: '2px' }}>
            Press ESC to resume
          </p>
        </div>

        {/* Match Stats */}
        <div style={{
          padding: '25px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>TIME</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffff' }}>
              {formatTime(matchTime)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>KILLS</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff00' }}>
              {kills}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>DEATHS</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff0000' }}>
              {deaths}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>K/D</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700' }}>
              {kdRatio}
            </div>
          </div>
        </div>

        {/* Menu Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {menuItems.map((item) => {
            const isHovered = hoveredButton === item.id

            return (
              <button
                key={item.id}
                onMouseEnter={() => setHoveredButton(item.id)}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={item.onClick}
                style={{
                  padding: '18px 35px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: isHovered ? `${item.color}22` : 'rgba(0, 0, 0, 0.5)',
                  color: isHovered ? item.color : '#fff',
                  border: `2px solid ${isHovered ? item.color : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  letterSpacing: '2px',
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isHovered ? `0 0 20px ${item.color}` : 'none'
                }}
              >
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Hint */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          opacity: 0.5,
          marginTop: '10px'
        }}>
          💡 TIP: Use TAB for Leaderboard, L for Loadout, C for Character
        </div>
      </div>
    </div>
  )
}

export default InGameMenuUI

