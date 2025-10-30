/**
 * 🏆 MATCH SUMMARY SCREEN
 * 
 * Post-game stats display
 * - Victory/Defeat Banner
 * - Player Stats (K/D/A, Accuracy, Headshots, Damage)
 * - Awards (MVP, Most Kills, Best KD, etc.)
 * - XP Progress Bar (animated)
 * - Unlocks Showcase (new weapons, skins, characters)
 */

import React, { useState, useEffect } from 'react'

export interface PlayerMatchStats {
  kills: number
  deaths: number
  assists: number
  accuracy: number
  headshots: number
  damageDealt: number
  bestKillstreak: number
  totalShots: number
  shotsHit: number
}

export interface Award {
  id: string
  name: string
  description: string
  icon: string
  value?: number
}

export interface Unlock {
  id: string
  type: 'weapon' | 'skin' | 'character' | 'attachment'
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon?: string
}

export interface MatchSummaryData {
  victory: boolean
  matchDuration: number // seconds
  playerStats: PlayerMatchStats
  awards: Award[]
  xpEarned: number
  xpTotal: number
  xpToNextLevel: number
  level: number
  unlocks: Unlock[]
}

interface MatchSummaryScreenProps {
  data: MatchSummaryData
  onContinue: () => void
}

export const MatchSummaryScreen: React.FC<MatchSummaryScreenProps> = ({ data, onContinue }) => {
  const [xpAnimProgress, setXpAnimProgress] = useState(0)
  const [showUnlocks, setShowUnlocks] = useState(false)

  useEffect(() => {
    // Animate XP progress bar
    const startXP = data.xpTotal - data.xpEarned
    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = data.xpEarned / steps
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const progress = Math.min((currentStep / steps) * 100, 100)
      setXpAnimProgress(progress)

      if (currentStep >= steps) {
        clearInterval(interval)
        // Show unlocks after XP animation
        if (data.unlocks.length > 0) {
          setTimeout(() => setShowUnlocks(true), 500)
        }
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [data.xpEarned])

  const kdRatio = data.playerStats.deaths > 0 
    ? (data.playerStats.kills / data.playerStats.deaths).toFixed(2) 
    : data.playerStats.kills.toFixed(2)

  const currentXPPercent = ((data.xpTotal % data.xpToNextLevel) / data.xpToNextLevel) * 100

  return (
    <div style={styles.container}>
      {/* Victory/Defeat Banner */}
      <div style={{
        ...styles.banner,
        backgroundColor: data.victory ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.2)',
        borderColor: data.victory ? '#00ff88' : '#ff4444'
      }}>
        <h1 style={{
          ...styles.bannerText,
          color: data.victory ? '#00ff88' : '#ff4444'
        }}>
          {data.victory ? '🏆 VICTORY!' : '💀 DEFEAT'}
        </h1>
        <p style={styles.duration}>
          Match Duration: {Math.floor(data.matchDuration / 60)}:{(data.matchDuration % 60).toString().padStart(2, '0')}
        </p>
      </div>

      <div style={styles.content}>
        {/* Player Stats */}
        <div style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>YOUR STATS</h2>
          
          <div style={styles.statsGrid}>
            <StatCard label="KILLS" value={data.playerStats.kills} color="#00ff88" />
            <StatCard label="DEATHS" value={data.playerStats.deaths} color="#ff4444" />
            <StatCard label="ASSISTS" value={data.playerStats.assists} color="#ffaa00" />
            <StatCard label="K/D RATIO" value={kdRatio} color="#00aaff" />
          </div>

          <div style={styles.statsGrid}>
            <StatCard label="ACCURACY" value={`${data.playerStats.accuracy.toFixed(1)}%`} color="#aa00ff" />
            <StatCard label="HEADSHOTS" value={data.playerStats.headshots} color="#ff0088" />
            <StatCard label="DAMAGE" value={data.playerStats.damageDealt.toLocaleString()} color="#ffff00" />
            <StatCard label="BEST STREAK" value={data.playerStats.bestKillstreak} color="#ff8800" />
          </div>
        </div>

        {/* Awards */}
        {data.awards.length > 0 && (
          <div style={styles.awardsSection}>
            <h2 style={styles.sectionTitle}>AWARDS</h2>
            <div style={styles.awardsGrid}>
              {data.awards.map(award => (
                <div key={award.id} style={styles.award}>
                  <div style={styles.awardIcon}>{award.icon}</div>
                  <div style={styles.awardName}>{award.name}</div>
                  {award.value && (
                    <div style={styles.awardValue}>{award.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* XP Progress */}
        <div style={styles.xpSection}>
          <h2 style={styles.sectionTitle}>EXPERIENCE</h2>
          <div style={styles.xpInfo}>
            <span>Level {data.level}</span>
            <span>+{data.xpEarned} XP</span>
          </div>
          <div style={styles.xpBarContainer}>
            <div 
              style={{
                ...styles.xpBarFill,
                width: `${(xpAnimProgress / 100) * currentXPPercent}%`
              }} 
            />
          </div>
          <div style={styles.xpText}>
            {data.xpTotal % data.xpToNextLevel} / {data.xpToNextLevel} XP
          </div>
        </div>

        {/* Unlocks */}
        {showUnlocks && data.unlocks.length > 0 && (
          <div style={styles.unlocksSection}>
            <h2 style={styles.sectionTitle}>🎉 NEW UNLOCKS!</h2>
            <div style={styles.unlocksGrid}>
              {data.unlocks.map(unlock => (
                <div key={unlock.id} style={{
                  ...styles.unlock,
                  borderColor: getRarityColor(unlock.rarity)
                }}>
                  <div style={styles.unlockType}>{unlock.type.toUpperCase()}</div>
                  <div style={styles.unlockName}>{unlock.name}</div>
                  <div style={{
                    ...styles.unlockRarity,
                    color: getRarityColor(unlock.rarity)
                  }}>
                    {unlock.rarity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button 
          onClick={onContinue}
          style={styles.continueButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00ff88'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00cc66'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}

// StatCard Component
interface StatCardProps {
  label: string
  value: string | number
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div style={styles.statCard}>
    <div style={styles.statLabel}>{label}</div>
    <div style={{ ...styles.statValue, color }}>{value}</div>
  </div>
)

// Helper function for rarity colors
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#ffffff'
    case 'rare': return '#0088ff'
    case 'epic': return '#aa00ff'
    case 'legendary': return '#ffaa00'
    default: return '#ffffff'
  }
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflowY: 'auto',
    zIndex: 10000,
    padding: '20px',
    fontFamily: '"Arial", sans-serif'
  },
  banner: {
    width: '100%',
    maxWidth: '1200px',
    padding: '40px',
    textAlign: 'center',
    border: '2px solid',
    borderRadius: '10px',
    marginBottom: '30px'
  },
  bannerText: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 0 20px currentColor'
  },
  duration: {
    fontSize: '18px',
    color: '#cccccc',
    margin: '10px 0 0 0'
  },
  content: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    borderBottom: '2px solid #333',
    paddingBottom: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold'
  },
  awardsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  awardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  award: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  awardIcon: {
    fontSize: '36px'
  },
  awardName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffaa00'
  },
  awardValue: {
    fontSize: '20px',
    color: '#ffffff'
  },
  xpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  xpInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    color: '#ffffff'
  },
  xpBarContainer: {
    width: '100%',
    height: '30px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00ff88, #00aaff)',
    transition: 'width 0.5s ease-out'
  },
  xpText: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center'
  },
  unlocksSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.5s ease-in'
  },
  unlocksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  unlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    animation: 'scaleIn 0.3s ease-out'
  },
  unlockType: {
    fontSize: '10px',
    color: '#999',
    fontWeight: 'bold'
  },
  unlockName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff'
  },
  unlockRarity: {
    fontSize: '12px',
    fontWeight: 'bold'
  },
  continueButton: {
    backgroundColor: '#00cc66',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '20px 60px',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    alignSelf: 'center',
    marginTop: '20px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0, 204, 102, 0.3)'
  }
}

