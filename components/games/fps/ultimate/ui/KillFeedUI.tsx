/**
 * 💀 KILL FEED UI
 * 
 * Live Kill Log (Top Right Corner)
 */

'use client'

import React, { useState, useEffect } from 'react'

export interface KillFeedEntry {
  id: string
  killerName: string
  victimName: string
  weaponIcon: string
  isHeadshot: boolean
  timestamp: number
}

interface KillFeedUIProps {
  maxEntries?: number
  displayDuration?: number // milliseconds
}

export const KillFeedUI: React.FC<KillFeedUIProps> = ({
  maxEntries = 5,
  displayDuration = 5000
}) => {
  const [entries, setEntries] = useState<KillFeedEntry[]>([])

  useEffect(() => {
    // Cleanup old entries
    const interval = setInterval(() => {
      const now = Date.now()
      setEntries(prev => prev.filter(entry => now - entry.timestamp < displayDuration))
    }, 1000)

    return () => clearInterval(interval)
  }, [displayDuration])

  // Expose method to add kill feed entry
  useEffect(() => {
    // @ts-ignore - Global API
    window.addKillFeedEntry = (entry: KillFeedEntry) => {
      setEntries(prev => [entry, ...prev].slice(0, maxEntries))
    }

    return () => {
      // @ts-ignore
      delete window.addKillFeedEntry
    }
  }, [maxEntries])

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '30px',
      width: '350px',
      zIndex: 1000,
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif'
    }}>
      {entries.map((entry, index) => {
        const age = Date.now() - entry.timestamp
        const opacity = Math.max(0, 1 - (age / displayDuration))

        return (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 15px',
              marginBottom: '6px',
              backgroundColor: `rgba(0, 0, 0, ${0.7 * opacity})`,
              border: `1px solid rgba(255, 255, 255, ${0.3 * opacity})`,
              borderRadius: '4px',
              fontSize: '14px',
              color: '#fff',
              opacity: opacity,
              transform: `translateX(${(1 - opacity) * 50}px)`,
              transition: 'all 0.3s ease',
              animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none'
            }}
          >
            {/* Killer Name */}
            <span style={{
              fontWeight: 'bold',
              color: '#00ffff'
            }}>
              {entry.killerName}
            </span>

            {/* Weapon Icon */}
            <span style={{
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              {entry.weaponIcon}
              {entry.isHeadshot && (
                <span style={{
                  fontSize: '12px',
                  color: '#ff0000',
                  textShadow: '0 0 5px #ff0000'
                }}>
                  💥
                </span>
              )}
            </span>

            {/* Victim Name */}
            <span style={{
              fontWeight: 'bold',
              color: '#ff0000'
            }}>
              {entry.victimName}
            </span>
          </div>
        )
      })}

      <style jsx>{`
        @keyframes slideIn {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default KillFeedUI

