/**
 * ⚙️ SETTINGS MENU UI
 * 
 * Complete Settings Configuration
 */

'use client'

import React, { useState } from 'react'

interface SettingsMenuUIProps {
  onClose: () => void
  settings: GameSettings
  onSettingsChange: (newSettings: GameSettings) => void
}

export interface GameSettings {
  // Graphics
  graphics: {
    resolution: string
    quality: 'low' | 'medium' | 'high' | 'ultra'
    fov: number
    vsync: boolean
    antialiasing: boolean
    shadows: boolean
    showFPS: boolean
  }
  // Audio
  audio: {
    masterVolume: number
    musicVolume: number
    sfxVolume: number
    voiceVolume: number
  }
  // Controls
  controls: {
    mouseSensitivity: number
    invertMouse: boolean
    crosshairColor: string
    crosshairSize: number
    showDamageNumbers: boolean
    showHitmarkers: boolean
  }
  // Gameplay
  gameplay: {
    autoReload: boolean
    showKillfeed: boolean
    fieldOfView: number
  }
}

export const SettingsMenuUI: React.FC<SettingsMenuUIProps> = ({
  onClose,
  settings,
  onSettingsChange
}) => {
  const [activeTab, setActiveTab] = useState<'graphics' | 'audio' | 'controls' | 'gameplay'>('graphics')
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings)

  const handleChange = (category: keyof GameSettings, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    onClose()
  }

  const handleReset = () => {
    setLocalSettings(settings)
  }

  const tabs = [
    { id: 'graphics', label: 'GRAPHICS', icon: '🎨' },
    { id: 'audio', label: 'AUDIO', icon: '🔊' },
    { id: 'controls', label: 'CONTROLS', icon: '🎮' },
    { id: 'gameplay', label: 'GAMEPLAY', icon: '⚔️' }
  ] as const

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
        padding: '20px 40px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(20,20,40,0.8) 100%)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '32px',
          textShadow: '0 0 10px rgba(0,255,255,0.8)',
          color: '#00ffff'
        }}>
          ⚙️ SETTINGS
        </h1>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ✖ CLOSE
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '0 40px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 30px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: activeTab === tab.id ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              color: activeTab === tab.id ? '#00ffff' : '#fff',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #00ffff' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* GRAPHICS TAB */}
          {activeTab === 'graphics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Quality Preset */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                  QUALITY PRESET
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['low', 'medium', 'high', 'ultra'] as const).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => handleChange('graphics', 'quality', quality)}
                      style={{
                        flex: 1,
                        padding: '15px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: localSettings.graphics.quality === quality ? '#00ffff' : 'rgba(255, 255, 255, 0.1)',
                        color: localSettings.graphics.quality === quality ? '#000' : '#fff',
                        border: `2px solid ${localSettings.graphics.quality === quality ? '#00ffff' : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              {/* FOV Slider */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                  FIELD OF VIEW: {localSettings.graphics.fov}°
                </label>
                <input
                  type="range"
                  min="60"
                  max="120"
                  value={localSettings.graphics.fov}
                  onChange={(e) => handleChange('graphics', 'fov', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Toggles */}
              {[
                { key: 'vsync', label: 'V-SYNC' },
                { key: 'antialiasing', label: 'ANTI-ALIASING' },
                { key: 'shadows', label: 'SHADOWS' },
                { key: 'showFPS', label: 'SHOW FPS COUNTER' }
              ].map((toggle) => (
                <div key={toggle.key} style={{
                  padding: '15px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px' }}>{toggle.label}</span>
                  <button
                    onClick={() => handleChange('graphics', toggle.key, !localSettings.graphics[toggle.key as keyof typeof localSettings.graphics])}
                    style={{
                      padding: '8px 20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: localSettings.graphics[toggle.key as keyof typeof localSettings.graphics] ? '#00ff00' : '#ff0000',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {localSettings.graphics[toggle.key as keyof typeof localSettings.graphics] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {[
                { key: 'masterVolume', label: 'MASTER VOLUME' },
                { key: 'musicVolume', label: 'MUSIC VOLUME' },
                { key: 'sfxVolume', label: 'SFX VOLUME' },
                { key: 'voiceVolume', label: 'VOICE VOLUME' }
              ].map((volume) => (
                <div key={volume.key}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                    {volume.label}: {localSettings.audio[volume.key as keyof typeof localSettings.audio]}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.audio[volume.key as keyof typeof localSettings.audio]}
                    onChange={(e) => handleChange('audio', volume.key, parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* CONTROLS TAB */}
          {activeTab === 'controls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Mouse Sensitivity */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                  MOUSE SENSITIVITY: {localSettings.controls.mouseSensitivity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={localSettings.controls.mouseSensitivity}
                  onChange={(e) => handleChange('controls', 'mouseSensitivity', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Crosshair Size */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', opacity: 0.8 }}>
                  CROSSHAIR SIZE: {localSettings.controls.crosshairSize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={localSettings.controls.crosshairSize}
                  onChange={(e) => handleChange('controls', 'crosshairSize', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Toggles */}
              {[
                { key: 'invertMouse', label: 'INVERT MOUSE' },
                { key: 'showDamageNumbers', label: 'SHOW DAMAGE NUMBERS' },
                { key: 'showHitmarkers', label: 'SHOW HITMARKERS' }
              ].map((toggle) => (
                <div key={toggle.key} style={{
                  padding: '15px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px' }}>{toggle.label}</span>
                  <button
                    onClick={() => handleChange('controls', toggle.key, !localSettings.controls[toggle.key as keyof typeof localSettings.controls])}
                    style={{
                      padding: '8px 20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: localSettings.controls[toggle.key as keyof typeof localSettings.controls] ? '#00ff00' : '#ff0000',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {localSettings.controls[toggle.key as keyof typeof localSettings.controls] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* GAMEPLAY TAB */}
          {activeTab === 'gameplay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {[
                { key: 'autoReload', label: 'AUTO RELOAD' },
                { key: 'showKillfeed', label: 'SHOW KILLFEED' }
              ].map((toggle) => (
                <div key={toggle.key} style={{
                  padding: '15px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px' }}>{toggle.label}</span>
                  <button
                    onClick={() => handleChange('gameplay', toggle.key, !localSettings.gameplay[toggle.key as keyof typeof localSettings.gameplay])}
                    style={{
                      padding: '8px 20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: localSettings.gameplay[toggle.key as keyof typeof localSettings.gameplay] ? '#00ff00' : '#ff0000',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {localSettings.gameplay[toggle.key as keyof typeof localSettings.gameplay] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div style={{
        padding: '20px 40px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 30px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          RESET
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 40px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: '#00ffff',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}
        >
          SAVE & APPLY
        </button>
      </div>
    </div>
  )
}

export default SettingsMenuUI

