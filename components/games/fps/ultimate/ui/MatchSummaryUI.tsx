/**
 * 📊 MATCH SUMMARY UI
 * 
 * End-of-Match Statistics & Rewards
 */

'use client'

import React from 'react'

interface MatchStats {
  kills: number
  deaths: number
  headshots: number
  accuracy: number
  score: number
  xpEarned: number
  longestKillDistance: number
  killStreak: number
  damageDealt: number
}

interface MatchSummaryUIProps {
  stats: MatchStats
  victory: boolean
  matchDuration: number
  onContinue: () => void
}

export const MatchSummaryUI: React.FC<MatchSummaryUIProps> = ({
  stats,
  victory,
  matchDuration,
  onContinue
}) => {
  const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      padding: '40px'
    }}>
      {/* Victory/Defeat Banner */}
      <div style={{
        fontSize: '72px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: victory ? '#00ff00' : '#ff0000',
        textShadow: `0 0 30px ${victory ? '#00ff00' : '#ff0000'}`,
        animation: 'pulse 2s ease-in-out infinite',
        letterSpacing: '10px'
      }}>
        {victory ? '🏆 VICTORY' : '💀 DEFEAT'}
      </div>

      {/* Stats Grid */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { label: 'KILLS', value: stats.kills, color: '#00ff00' },
          { label: 'DEATHS', value: stats.deaths, color: '#ff0000' },
          { label: 'K/D RATIO', value: kdRatio, color: '#ffd700' },
          { label: 'HEADSHOTS', value: stats.headshots, color: '#ff9500' },
          { label: 'ACCURACY', value: `${stats.accuracy.toFixed(1)}%`, color: '#00ffff' },
          { label: 'SCORE', value: stats.score, color: '#ff00ff' },
          { label: 'LONGEST KILL', value: `${stats.longestKillDistance.toFixed(0)}m`, color: '#888' },
          { label: 'BEST STREAK', value: stats.killStreak, color: '#888' },
          { label: 'MATCH TIME', value: formatTime(matchDuration), color: '#888' }
        ].map((stat, index) => (
          <div key={index} style={{
            padding: '25px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: `2px solid ${stat.color}`,
            borderRadius: '8px',
            textAlign: 'center',
            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px', letterSpacing: '2px' }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: stat.color,
              textShadow: `0 0 10px ${stat.color}`
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* XP Earned */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        padding: '30px',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        border: '2px solid #00ffff',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '30px',
        animation: 'fadeInUp 1.2s ease-out both'
      }}>
        <div style={{ fontSize: '18px', opacity: 0.8, marginBottom: '15px', letterSpacing: '2px' }}>
          XP EARNED
        </div>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#00ffff',
          textShadow: '0 0 20px #00ffff'
        }}>
          +{stats.xpEarned} XP
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        style={{
          padding: '20px 60px',
          fontSize: '24px',
          fontWeight: 'bold',
          backgroundColor: '#00ffff',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          letterSpacing: '2px',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
          animation: 'fadeInUp 1.5s ease-out both',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        CONTINUE
      </button>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default MatchSummaryUI

