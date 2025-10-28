// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Monitor, 
  Volume2, 
  Keyboard, 
  Mouse,
  X,
  Home,
  RotateCcw
} from 'lucide-react';

interface GameSettings {
  mouseSensitivity: number;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  vsync: boolean;
  fullscreen: boolean;
  crosshairEnabled: boolean;
  keyBindings: {
    forward: string;
    backward: string;
    left: string;
    right: string;
    jump: string;
    crouch: string;
    slide: string;
    sprint: string;
    reload: string;
    melee: string;
  };
}

interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onExitGame: () => void;
  onRestartGame: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onExitGame,
  onRestartGame
}) => {
  if (!isOpen) return null;

  const handleSliderChange = (key: keyof GameSettings, value: number[]) => {
    onSettingsChange({
      ...settings,
      [key]: value[0]
    });
  };

  const handleSwitchChange = (key: keyof GameSettings, checked: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: checked
    });
  };

  const handleKeyBindingChange = (key: string, value: string) => {
    onSettingsChange({
      ...settings,
      keyBindings: {
        ...settings.keyBindings,
        [key]: value.toUpperCase()
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <span>OPTIONEN</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Game Actions */}
          <div className="flex space-x-4">
            <Button
              onClick={onRestartGame}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Spiel Neustarten
            </Button>
            <Button
              onClick={onExitGame}
              variant="destructive"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Spiel Beenden
            </Button>
          </div>

          {/* Graphics Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-white">Grafik</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">V-Sync</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.vsync}
                    onCheckedChange={(checked) => handleSwitchChange('vsync', checked)}
                  />
                  <span className="text-sm text-gray-400">
                    {settings.vsync ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Vollbild</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.fullscreen}
                    onCheckedChange={(checked) => handleSwitchChange('fullscreen', checked)}
                  />
                  <span className="text-sm text-gray-400">
                    {settings.fullscreen ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-white">Audio</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Master Lautstärke: {settings.masterVolume}%</Label>
                <Slider
                  value={[settings.masterVolume]}
                  onValueChange={(value) => handleSliderChange('masterVolume', value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Musik Lautstärke: {settings.musicVolume}%</Label>
                <Slider
                  value={[settings.musicVolume]}
                  onValueChange={(value) => handleSliderChange('musicVolume', value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Soundeffekte Lautstärke: {settings.sfxVolume}%</Label>
                <Slider
                  value={[settings.sfxVolume]}
                  onValueChange={(value) => handleSliderChange('sfxVolume', value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Mouse Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mouse className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-white">Maus</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Mausempfindlichkeit: {settings.mouseSensitivity}</Label>
                <Slider
                  value={[settings.mouseSensitivity]}
                  onValueChange={(value) => handleSliderChange('mouseSensitivity', value)}
                  max={5}
                  step={0.1}
                  min={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Fadenkreuz</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.crosshairEnabled}
                    onCheckedChange={(checked) => handleSwitchChange('crosshairEnabled', checked)}
                  />
                  <span className="text-sm text-gray-400">
                    {settings.crosshairEnabled ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Bindings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Tastenbelegung</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.keyBindings).map(([action, key]) => (
                <div key={action} className="space-y-2">
                  <Label className="text-gray-300 capitalize">
                    {action === 'forward' ? 'Vorwärts' :
                     action === 'backward' ? 'Rückwärts' :
                     action === 'left' ? 'Links' :
                     action === 'right' ? 'Rechts' :
                     action === 'jump' ? 'Springen' :
                     action === 'crouch' ? 'Ducken' :
                     action === 'slide' ? 'Rutschen' :
                     action === 'sprint' ? 'Sprinten' :
                     action === 'reload' ? 'Nachladen' :
                     action === 'melee' ? 'Nahkampf' : action}
                  </Label>
                  <Input
                    value={key}
                    onChange={(e) => handleKeyBindingChange(action, e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white text-center font-mono"
                    maxLength={1}
                    readOnly
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-700">
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Übernehmen & Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};