/**
 * 🔊 SOUND LIBRARY
 * 
 * Complete Sound Effects Database
 */

export interface SoundDefinition {
  id: string
  category: 'weapon' | 'player' | 'environment' | 'ui' | 'voice'
  path: string
  volume?: number
  loop?: boolean
  spatial?: boolean
}

export const SOUND_LIBRARY: SoundDefinition[] = [
  // ============================================================================
  // 🔫 WEAPON SOUNDS
  // ============================================================================
  
  // Pistols
  { id: 'pistol_fire', category: 'weapon', path: '/sounds/weapons/pistol_fire.mp3', volume: 0.7, spatial: true },
  { id: 'pistol_reload', category: 'weapon', path: '/sounds/weapons/pistol_reload.mp3', volume: 0.6, spatial: true },
  { id: 'pistol_empty', category: 'weapon', path: '/sounds/weapons/pistol_empty.mp3', volume: 0.5, spatial: true },
  
  // Assault Rifles
  { id: 'ar_fire', category: 'weapon', path: '/sounds/weapons/ar_fire.mp3', volume: 0.8, spatial: true },
  { id: 'ar_reload', category: 'weapon', path: '/sounds/weapons/ar_reload.mp3', volume: 0.7, spatial: true },
  { id: 'ar_empty', category: 'weapon', path: '/sounds/weapons/ar_empty.mp3', volume: 0.5, spatial: true },
  { id: 'm4a1_fire', category: 'weapon', path: '/sounds/weapons/m4a1_fire.mp3', volume: 0.8, spatial: true },
  { id: 'ak47_fire', category: 'weapon', path: '/sounds/weapons/ak47_fire.mp3', volume: 0.85, spatial: true },
  
  // SMGs
  { id: 'smg_fire', category: 'weapon', path: '/sounds/weapons/smg_fire.mp3', volume: 0.7, spatial: true },
  { id: 'smg_reload', category: 'weapon', path: '/sounds/weapons/smg_reload.mp3', volume: 0.6, spatial: true },
  { id: 'mp5_fire', category: 'weapon', path: '/sounds/weapons/mp5_fire.mp3', volume: 0.7, spatial: true },
  
  // Sniper Rifles
  { id: 'sniper_fire', category: 'weapon', path: '/sounds/weapons/sniper_fire.mp3', volume: 1.0, spatial: true },
  { id: 'sniper_reload', category: 'weapon', path: '/sounds/weapons/sniper_reload.mp3', volume: 0.8, spatial: true },
  { id: 'sniper_bolt', category: 'weapon', path: '/sounds/weapons/sniper_bolt.mp3', volume: 0.7, spatial: true },
  { id: 'awp_fire', category: 'weapon', path: '/sounds/weapons/awp_fire.mp3', volume: 1.0, spatial: true },
  
  // Shotguns
  { id: 'shotgun_fire', category: 'weapon', path: '/sounds/weapons/shotgun_fire.mp3', volume: 0.9, spatial: true },
  { id: 'shotgun_reload', category: 'weapon', path: '/sounds/weapons/shotgun_reload.mp3', volume: 0.7, spatial: true },
  { id: 'shotgun_pump', category: 'weapon', path: '/sounds/weapons/shotgun_pump.mp3', volume: 0.6, spatial: true },
  
  // LMGs
  { id: 'lmg_fire', category: 'weapon', path: '/sounds/weapons/lmg_fire.mp3', volume: 0.85, spatial: true },
  { id: 'lmg_reload', category: 'weapon', path: '/sounds/weapons/lmg_reload.mp3', volume: 0.75, spatial: true },
  
  // Universal
  { id: 'weapon_switch', category: 'weapon', path: '/sounds/weapons/weapon_switch.mp3', volume: 0.5 },
  { id: 'shell_casing', category: 'weapon', path: '/sounds/weapons/shell_casing.mp3', volume: 0.3, spatial: true },
  
  // ============================================================================
  // 👤 PLAYER SOUNDS
  // ============================================================================
  
  // Movement
  { id: 'footstep_concrete', category: 'player', path: '/sounds/player/footstep_concrete.mp3', volume: 0.4, spatial: true },
  { id: 'footstep_metal', category: 'player', path: '/sounds/player/footstep_metal.mp3', volume: 0.4, spatial: true },
  { id: 'footstep_wood', category: 'player', path: '/sounds/player/footstep_wood.mp3', volume: 0.4, spatial: true },
  { id: 'footstep_grass', category: 'player', path: '/sounds/player/footstep_grass.mp3', volume: 0.3, spatial: true },
  { id: 'jump', category: 'player', path: '/sounds/player/jump.mp3', volume: 0.5, spatial: true },
  { id: 'land', category: 'player', path: '/sounds/player/land.mp3', volume: 0.6, spatial: true },
  { id: 'slide', category: 'player', path: '/sounds/player/slide.mp3', volume: 0.5, spatial: true },
  
  // Damage
  { id: 'damage_light', category: 'player', path: '/sounds/player/damage_light.mp3', volume: 0.6 },
  { id: 'damage_heavy', category: 'player', path: '/sounds/player/damage_heavy.mp3', volume: 0.8 },
  { id: 'death', category: 'player', path: '/sounds/player/death.mp3', volume: 0.7, spatial: true },
  { id: 'heartbeat', category: 'player', path: '/sounds/player/heartbeat.mp3', volume: 0.5, loop: true },
  
  // Actions
  { id: 'heal', category: 'player', path: '/sounds/player/heal.mp3', volume: 0.6 },
  { id: 'armor_equip', category: 'player', path: '/sounds/player/armor_equip.mp3', volume: 0.5 },
  
  // ============================================================================
  // 🌍 ENVIRONMENT SOUNDS
  // ============================================================================
  
  // Impacts
  { id: 'impact_concrete', category: 'environment', path: '/sounds/environment/impact_concrete.mp3', volume: 0.5, spatial: true },
  { id: 'impact_metal', category: 'environment', path: '/sounds/environment/impact_metal.mp3', volume: 0.6, spatial: true },
  { id: 'impact_wood', category: 'environment', path: '/sounds/environment/impact_wood.mp3', volume: 0.5, spatial: true },
  { id: 'impact_flesh', category: 'environment', path: '/sounds/environment/impact_flesh.mp3', volume: 0.4, spatial: true },
  
  // Explosions
  { id: 'explosion', category: 'environment', path: '/sounds/environment/explosion.mp3', volume: 1.0, spatial: true },
  { id: 'grenade_bounce', category: 'environment', path: '/sounds/environment/grenade_bounce.mp3', volume: 0.4, spatial: true },
  
  // Ambient
  { id: 'ambient_wind', category: 'environment', path: '/sounds/environment/ambient_wind.mp3', volume: 0.2, loop: true },
  { id: 'ambient_city', category: 'environment', path: '/sounds/environment/ambient_city.mp3', volume: 0.3, loop: true },
  { id: 'ambient_industrial', category: 'environment', path: '/sounds/environment/ambient_industrial.mp3', volume: 0.3, loop: true },
  
  // ============================================================================
  // 🎮 UI SOUNDS
  // ============================================================================
  
  { id: 'ui_click', category: 'ui', path: '/sounds/ui/click.mp3', volume: 0.5 },
  { id: 'ui_hover', category: 'ui', path: '/sounds/ui/hover.mp3', volume: 0.3 },
  { id: 'ui_back', category: 'ui', path: '/sounds/ui/back.mp3', volume: 0.4 },
  { id: 'ui_confirm', category: 'ui', path: '/sounds/ui/confirm.mp3', volume: 0.6 },
  { id: 'ui_error', category: 'ui', path: '/sounds/ui/error.mp3', volume: 0.5 },
  
  // Notifications
  { id: 'notification', category: 'ui', path: '/sounds/ui/notification.mp3', volume: 0.6 },
  { id: 'level_up', category: 'ui', path: '/sounds/ui/level_up.mp3', volume: 0.8 },
  { id: 'achievement', category: 'ui', path: '/sounds/ui/achievement.mp3', volume: 0.7 },
  { id: 'kill', category: 'ui', path: '/sounds/ui/kill.mp3', volume: 0.6 },
  { id: 'double_kill', category: 'ui', path: '/sounds/ui/double_kill.mp3', volume: 0.7 },
  { id: 'triple_kill', category: 'ui', path: '/sounds/ui/triple_kill.mp3', volume: 0.8 },
  { id: 'mega_kill', category: 'ui', path: '/sounds/ui/mega_kill.mp3', volume: 0.9 },
  { id: 'ultra_kill', category: 'ui', path: '/sounds/ui/ultra_kill.mp3', volume: 1.0 },
  
  // ============================================================================
  // 🎤 VOICE LINES (ANNOUNCER)
  // ============================================================================
  
  { id: 'voice_victory', category: 'voice', path: '/sounds/voice/victory.mp3', volume: 0.8 },
  { id: 'voice_defeat', category: 'voice', path: '/sounds/voice/defeat.mp3', volume: 0.8 },
  { id: 'voice_headshot', category: 'voice', path: '/sounds/voice/headshot.mp3', volume: 0.7 },
  { id: 'voice_killstreak_5', category: 'voice', path: '/sounds/voice/killstreak_5.mp3', volume: 0.8 },
  { id: 'voice_killstreak_10', category: 'voice', path: '/sounds/voice/killstreak_10.mp3', volume: 0.9 },
  { id: 'voice_dominating', category: 'voice', path: '/sounds/voice/dominating.mp3', volume: 0.8 },
  { id: 'voice_unstoppable', category: 'voice', path: '/sounds/voice/unstoppable.mp3', volume: 0.9 }
]

/**
 * Get sound by ID
 */
export function getSoundById(id: string): SoundDefinition | undefined {
  return SOUND_LIBRARY.find(sound => sound.id === id)
}

/**
 * Get sounds by category
 */
export function getSoundsByCategory(category: SoundDefinition['category']): SoundDefinition[] {
  return SOUND_LIBRARY.filter(sound => sound.category === category)
}

/**
 * Get weapon sound for weapon type
 */
export function getWeaponSound(weaponId: string, action: 'fire' | 'reload' | 'empty'): string {
  // Try specific weapon sound first
  const specificSound = `${weaponId}_${action}`
  if (getSoundById(specificSound)) {
    return specificSound
  }
  
  // Fallback to generic sound based on weapon type
  if (weaponId.includes('pistol') || weaponId.includes('deagle')) {
    return `pistol_${action}`
  } else if (weaponId.includes('sniper') || weaponId.includes('awp')) {
    return `sniper_${action}`
  } else if (weaponId.includes('shotgun')) {
    return `shotgun_${action}`
  } else if (weaponId.includes('smg') || weaponId.includes('mp5')) {
    return `smg_${action}`
  } else if (weaponId.includes('lmg')) {
    return `lmg_${action}`
  } else {
    return `ar_${action}` // Default to assault rifle
  }
}

export default SOUND_LIBRARY

