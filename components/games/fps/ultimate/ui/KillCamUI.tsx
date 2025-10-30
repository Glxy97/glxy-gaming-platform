/**
 * 📹 KILL CAM UI
 * 
 * Displays kill cam replay overlay
 */

'use client'

import React from 'react'
import type { KillCamData } from '../systems/KillCamSystem'

interface KillCamUIProps {
  killCam: KillCamData
  onSkip: () => void
}

export const KillCamUI: React.FC<KillCamUIProps> = ({ killCam, onSkip }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Top Banner */}
      <div style={{
        position: 'absolute',
        top: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '15px 40px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #ff0000',
        borderRadius: '8px',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#ff0000',
          marginBottom: '5px',
          letterSpacing: '3px',
          fontWeight: 'bold'
        }}>
          ☠️ KILL CAM
        </div>
        <div style={{
          fontSize: '18px',
          color: '#fff',
          fontWeight: 'bold'
        }}>
          <span style={{ color: '#00ffff' }}>{killCam.killerName}</span>
          {' '} killed {' '}
          <span style={{ color: '#ff0000' }}>{killCam.victimName}</span>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginTop: '5px'
        }}>
          {killCam.weaponUsed} • {killCam.distance.toFixed(1)}m
          {killCam.isHeadshot && ' • 💥 HEADSHOT'}
        </div>
      </div>

      {/* Skip Button */}
      <div style={{
        position: 'absolute',
        bottom: '50px',
        right: '50px',
        pointerEvents: 'all'
      }}>
        <button
          onClick={onSkip}
          style={{
            padding: '12px 30px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.borderColor = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
        >
          SKIP [SPACE]
        </button>
      </div>

      {/* Film grain effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(0deg, transparent 0px, rgba(255,255,255,0.03) 2px, transparent 4px)',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none'
      }} />

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default KillCamUI

