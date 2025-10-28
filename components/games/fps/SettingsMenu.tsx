// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface GameSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra'
    shadows: boolean
    effects: boolean
    particles: boolean
  }
  audio: {
    masterVolume: number
    sfxVolume: number
    musicVolume: number
  }
  gameplay: {
    mouseSensitivity: number
    invertMouseY: boolean
    autoReload: boolean
    crosshairType: 'default' | 'dot' | 'cross' | 'circle'
  }
  controls: {
    keyBindings: {
      forward: string
      backward: string
      left: string
      right: string
      jump: string
      crouch: string
      sprint: string
      reload: string
      fire: string
    }
  }
}

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: GameSettings) => void
  initialSettings: GameSettings
}

export function SettingsMenu({ 
  isOpen, 
  onClose, 
  onSettingsChange, 
  initialSettings 
}: SettingsMenuProps) {
  const [settings, setSettings] = useState<GameSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<'graphics' | 'audio' | 'gameplay' | 'controls'>('graphics')

  if (!isOpen) return null

  const handleSave = () => {
    onSettingsChange(settings)
    onClose()
  }

  const handleReset = () => {
    setSettings(initialSettings)
  }

  const updateSetting = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return newSettings
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg border border-gray-600 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Einstellungen</h2>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(80vh-120px)]">
          {/* Sidebar */}
          <div className="w-48 bg-gray-800 border-r border-gray-600">
            <div className="p-4 space-y-2">
              {[
                { id: 'graphics', label: 'Grafik' },
                { id: 'audio', label: 'Audio' },
                { id: 'gameplay', label: 'Gameplay' },
                { id: 'controls', label: 'Steuerung' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'graphics' && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white">Qualität</Label>
                  <Select 
                    value={settings.graphics.quality} 
                    onValueChange={(value) => updateSetting(['graphics', 'quality'], value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Schatten</Label>
                    <Switch 
                      checked={settings.graphics.shadows}
                      onCheckedChange={(checked) => updateSetting(['graphics', 'shadows'], checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Effekte</Label>
                    <Switch 
                      checked={settings.graphics.effects}
                      onCheckedChange={(checked) => updateSetting(['graphics', 'effects'], checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Partikel</Label>
                    <Switch 
                      checked={settings.graphics.particles}
                      onCheckedChange={(checked) => updateSetting(['graphics', 'particles'], checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white">Master-Lautstärke: {Math.round(settings.audio.masterVolume * 100)}%</Label>
                  <Slider
                    value={[settings.audio.masterVolume]}
                    onValueChange={([value]) => updateSetting(['audio', 'masterVolume'], value)}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-white">SFX-Lautstärke: {Math.round(settings.audio.sfxVolume * 100)}%</Label>
                  <Slider
                    value={[settings.audio.sfxVolume]}
                    onValueChange={([value]) => updateSetting(['audio', 'sfxVolume'], value)}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-white">Musik-Lautstärke: {Math.round(settings.audio.musicVolume * 100)}%</Label>
                  <Slider
                    value={[settings.audio.musicVolume]}
                    onValueChange={([value]) => updateSetting(['audio', 'musicVolume'], value)}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'gameplay' && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white">Mausempfindlichkeit: {settings.gameplay.mouseSensitivity.toFixed(3)}</Label>
                  <Slider
                    value={[settings.gameplay.mouseSensitivity]}
                    onValueChange={([value]) => updateSetting(['gameplay', 'mouseSensitivity'], value)}
                    max={0.005}
                    min={0.001}
                    step={0.0001}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Maus-Y invertieren</Label>
                    <Switch 
                      checked={settings.gameplay.invertMouseY}
                      onCheckedChange={(checked) => updateSetting(['gameplay', 'invertMouseY'], checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Automatisch nachladen</Label>
                    <Switch 
                      checked={settings.gameplay.autoReload}
                      onCheckedChange={(checked) => updateSetting(['gameplay', 'autoReload'], checked)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Fadenkreuz-Typ</Label>
                  <Select 
                    value={settings.gameplay.crosshairType} 
                    onValueChange={(value) => updateSetting(['gameplay', 'crosshairType'], value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard</SelectItem>
                      <SelectItem value="dot">Punkt</SelectItem>
                      <SelectItem value="cross">Kreuz</SelectItem>
                      <SelectItem value="circle">Kreis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="space-y-4">
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-4">Tastenbelegung</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(settings.controls.keyBindings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-gray-300">
                          {key === 'forward' && 'Vorwärts'}
                          {key === 'backward' && 'Rückwärts'}
                          {key === 'left' && 'Links'}
                          {key === 'right' && 'Rechts'}
                          {key === 'jump' && 'Springen'}
                          {key === 'crouch' && 'Ducken'}
                          {key === 'sprint' && 'Sprinten'}
                          {key === 'reload' && 'Nachladen'}
                          {key === 'fire' && 'Feuer'}
                        </Label>
                        <div className="bg-gray-700 px-3 py-1 rounded text-sm">
                          {value.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-600">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleReset}>
              Zurücksetzen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}