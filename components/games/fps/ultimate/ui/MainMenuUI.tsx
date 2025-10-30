/**
 * 🎮 MAIN MENU UI
 * 
 * Professional AAA-Style Main Menu
 */

'use client'

import React, { useState } from 'react'
import type { PlayableCharacter } from '../types/CharacterTypes'

interface MainMenuUIProps {
  playerLevel: number
  playerXP: number
  playerName?: string
  onStartGame: () => void
  onCharacterSelect: () => void
  onLoadout: () => void
  onSettings: () => void
  onLeaderboards: () => void
  onExit?: () => void
  selectedCharacter: PlayableCharacter
}

export const MainMenuUI: React.FC<MainMenuUIProps> = ({
  playerLevel,
  playerXP,
  playerName = 'Player',
  onStartGame,
  onCharacterSelect,
  onLoadout,
  onSettings,
  onLeaderboards,
  onExit,
  selectedCharacter
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const menuItems = [
    { id: 'start', label: 'START GAME', icon: '🎮', onClick: onStartGame, color: '#00ffff' },
    { id: 'character', label: 'CHARACTER', icon: '👤', onClick: onCharacterSelect, color: '#ff00ff' },
    { id: 'loadout', label: 'LOADOUT', icon: '🔫', onClick: onLoadout, color: '#ff9500' },
    { id: 'leaderboards', label: 'LEADERBOARDS', icon: '🏆', onClick: onLeaderboards, color: '#ffd700' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙️', onClick: onSettings, color: '#888888' },
    ...(onExit ? [{ id: 'exit', label: 'EXIT', icon: '❌', onClick: onExit, color: '#ff0000' }] : [])
  ]

  return (
    <>
      <style jsx global>{`
        @keyframes scan {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px currentColor; }
          50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,10,30,0.98) 50%, rgba(0,0,0,0.95) 100%)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(0,255,255,0.03) 0px, transparent 2px, transparent 40px, rgba(0,255,255,0.03) 42px),
          repeating-linear-gradient(0deg, rgba(255,0,255,0.03) 0px, transparent 2px, transparent 40px, rgba(255,0,255,0.03) 42px)
        `,
        opacity: 0.5,
        animation: 'grid-move 20s linear infinite',
        pointerEvents: 'none'
      }} />

      {/* Glowing Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,0,255,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
        padding: '30px 50px',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        background: 'linear-gradient(90deg, rgba(0,255,255,0.1) 0%, transparent 50%, rgba(255,0,255,0.1) 100%)',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #00ffff 0%, #ff00ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(0,255,255,0.5)',
          letterSpacing: '3px'
        }}>
          GLXY FPS
        </h1>
        <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '14px', letterSpacing: '2px' }}>
          ULTIMATE COMBAT EXPERIENCE
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Side - Menu */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
          gap: '20px'
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
                  padding: '20px 40px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  backgroundColor: isHovered ? `${item.color}33` : 'rgba(0, 0, 0, 0.5)',
                  color: isHovered ? item.color : '#fff',
                  border: `2px solid ${isHovered ? item.color : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  letterSpacing: '2px',
                  transform: isHovered ? 'translateX(10px) scale(1.05)' : 'translateX(0) scale(1)',
                  boxShadow: isHovered ? `0 0 30px ${item.color}` : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Scan Line Effect */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${item.color}44, transparent)`,
                    animation: 'scan 1s ease-in-out infinite'
                  }} />
                )}
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Side - Player Info & Character Preview */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '50px',
          gap: '30px'
        }}>
          {/* Character Preview */}
          <div style={{
            width: '300px',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 100%)',
            border: '2px solid rgba(0,255,255,0.5)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,255,255,0.3)'
          }}>
            {/* Character Icon */}
            <div style={{
              fontSize: '120px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.8))'
            }}>
              👤
            </div>

            {/* Character Name */}
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#00ffff',
              textShadow: '0 0 10px #00ffff',
              marginBottom: '10px'
            }}>
              {selectedCharacter.displayName}
            </div>

            {/* Character Class */}
            <div style={{
              fontSize: '14px',
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              {selectedCharacter.rarity} • Level {selectedCharacter.level}
            </div>

            {/* Holographic Effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'repeating-linear-gradient(0deg, transparent 0px, rgba(0,255,255,0.03) 2px, transparent 4px)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Player Stats */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            padding: '25px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}>
            {/* Player Name & Level */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                {playerName}
              </div>
              <div style={{
                fontSize: '18px',
                color: '#00ffff',
                textShadow: '0 0 10px #00ffff'
              }}>
                LEVEL {playerLevel}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                opacity: 0.7,
                marginBottom: '8px'
              }}>
                <span>XP PROGRESS</span>
                <span>{playerXP} / {(playerLevel + 1) * 1000}</span>
              </div>
              <div style={{
                height: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(playerXP / ((playerLevel + 1) * 1000)) * 100}%`,
                  background: 'linear-gradient(90deg, #00ffff 0%, #ff00ff 100%)',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px #00ffff',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated Shine */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shine 2s ease-in-out infinite'
                  }} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              fontSize: '14px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.7, marginBottom: '5px' }}>CHARACTERS</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ffff' }}>
                  {selectedCharacter.isUnlocked ? '1' : '0'} / 21
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.7, marginBottom: '5px' }}>WEAPONS</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9500' }}>
                  5 / 20
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 50px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        opacity: 0.6,
        position: 'relative',
        zIndex: 1
      }}>
        <div>GLXY Gaming Platform © 2025</div>
        <div>Version 4.0.0 ULTIMATE</div>
      </div>
    </div>
    </>
  )
}

export default MainMenuUI

