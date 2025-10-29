/**
 * GLXY Ultimate FPS - UI Data
 *
 * Professional data-driven UI configuration system
 * Defines all UI layouts, themes, templates, and presets
 *
 * @module UIData
 * @category Data
 * @see GLXYUltimateUI.tsx for the implementation
 *
 * Architecture: Data-Driven Design
 * Pattern: ScriptableObject-style (Unity-inspired)
 *
 * Phase 6: UI Enhancements & Polish
 */

import * as THREE from 'three'

/**
 * UI Element Positions
 * Standard 9-zone layout system
 */
export enum UIPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  CENTER_LEFT = 'center-left',
  CENTER = 'center',
  CENTER_RIGHT = 'center-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right'
}

/**
 * UI Element Types
 */
export enum UIElementType {
  HUD = 'hud',
  HEALTH_BAR = 'health-bar',
  ARMOR_BAR = 'armor-bar',
  STAMINA_BAR = 'stamina-bar',
  AMMO_DISPLAY = 'ammo-display',
  CROSSHAIR = 'crosshair',
  MINIMAP = 'minimap',
  KILL_FEED = 'kill-feed',
  SCOREBOARD = 'scoreboard',
  TIMER = 'timer',
  OBJECTIVE_TRACKER = 'objective-tracker',
  NOTIFICATION = 'notification',
  TOOLTIP = 'tooltip',
  MENU = 'menu',
  DIALOG = 'dialog',
  SETTINGS = 'settings'
}

/**
 * UI Themes
 */
export enum UITheme {
  DEFAULT = 'default',
  DARK = 'dark',
  LIGHT = 'light',
  CYBERPUNK = 'cyberpunk',
  MILITARY = 'military',
  MINIMAL = 'minimal',
  GLXY = 'glxy',
  NEON = 'neon',
  TACTICAL = 'tactical'
}

/**
 * Animation Types
 */
export enum UIAnimationType {
  FADE = 'fade',
  SLIDE = 'slide',
  SCALE = 'scale',
  ROTATE = 'rotate',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  SHAKE = 'shake',
  PULSE = 'pulse',
  GLOW = 'glow',
  WAVE = 'wave'
}

/**
 * Notification Types
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  KILL = 'kill',
  DEATH = 'death',
  DAMAGE = 'damage',
  HEAL = 'heal',
  LEVEL_UP = 'levelup',
  UNLOCK = 'unlock',
  HEADSHOT = 'headshot',
  MULTI_KILL = 'multikill',
  STREAK = 'streak'
}

/**
 * Crosshair Styles
 */
export enum CrosshairStyle {
  DOT = 'dot',
  CROSS = 'cross',
  CIRCLE = 'circle',
  DIAMOND = 'diamond',
  SQUARE = 'square',
  T_SHAPE = 't-shape',
  CUSTOM = 'custom'
}

// =============================================================================
// UI LAYOUT DATA
// =============================================================================

/**
 * UI Element Configuration
 */
export interface UIElementData {
  id: string
  type: UIElementType
  position: UIPosition
  offset: { x: number; y: number } // Pixels from anchor
  size: { width: number; height: number } // Pixels or percentage
  visible: boolean
  enabled: boolean
  opacity: number // 0.0 - 1.0
  scale: number // 0.5 - 2.0
  zIndex: number

  // Animation
  animated: boolean
  animationType?: UIAnimationType
  animationDuration?: number // seconds
  animationLoop?: boolean

  // Interaction
  interactive: boolean
  tooltip?: string

  // Styling
  theme: UITheme
  customStyle?: Record<string, string>
}

/**
 * HUD Layout Preset
 */
export interface HUDLayoutData {
  id: string
  name: string
  description: string
  elements: UIElementData[]
  theme: UITheme
  scale: number
}

// =============================================================================
// THEME DATA
// =============================================================================

/**
 * Color Palette for UI Theme
 */
export interface ColorPalette {
  primary: string // Main accent color
  secondary: string // Secondary accent
  background: string // Background color
  backgroundSecondary: string // Secondary background
  text: string // Primary text
  textSecondary: string // Secondary text
  border: string // Border color
  success: string // Success color
  warning: string // Warning color
  error: string // Error color
  info: string // Info color
  health: string // Health color
  armor: string // Armor color
  stamina: string // Stamina color
  ammo: string // Ammo color
}

/**
 * UI Theme Data
 */
export interface UIThemeData {
  id: string
  name: string
  description: string
  colors: ColorPalette

  // Typography
  fontFamily: string
  fontSizeBase: number // pixels
  fontSizeSmall: number
  fontSizeLarge: number
  fontWeightNormal: number
  fontWeightBold: number

  // Spacing
  spacingSmall: number // pixels
  spacingMedium: number
  spacingLarge: number

  // Border
  borderRadius: number // pixels
  borderWidth: number

  // Effects
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  blurEnabled: boolean
  blurAmount: number // pixels

  // Animations
  animationDuration: number // seconds
  animationEasing: string
}

// =============================================================================
// NOTIFICATION DATA
// =============================================================================

/**
 * Notification Template
 */
export interface NotificationTemplate {
  id: string
  type: NotificationType
  icon: string // Emoji or icon name
  color: string // Hex color
  title: string
  message: string // Can contain {variables}
  duration: number // seconds
  priority: number // 0 (low) - 10 (high)

  // Animation
  animationType: UIAnimationType
  animationDuration: number
  animationEasing: string

  // Sound
  sound?: string
  soundVolume?: number

  // Haptic
  haptic?: boolean
  hapticPattern?: number[]
}

// =============================================================================
// KILL FEED DATA
// =============================================================================

/**
 * Kill Feed Entry Types
 */
export enum KillFeedType {
  KILL = 'kill',
  DEATH = 'death',
  ASSIST = 'assist',
  HEADSHOT = 'headshot',
  MELEE = 'melee',
  EXPLOSION = 'explosion',
  ENVIRONMENTAL = 'environmental',
  SUICIDE = 'suicide',
  TEAMKILL = 'teamkill'
}

/**
 * Kill Feed Template
 */
export interface KillFeedTemplate {
  id: string
  type: KillFeedType
  icon: string
  color: string
  format: string // "{killer} {icon} {victim}" with {headshot} modifier
  duration: number // seconds
  priority: number

  // Effects
  animationType: UIAnimationType
  glowEffect?: boolean
  glowColor?: string
  particleEffect?: boolean
}

/**
 * Kill Feed Entry Data
 */
export interface KillFeedEntry {
  id: string
  timestamp: number
  type: KillFeedType
  killer: string
  victim: string
  weapon: string
  weaponIcon?: string
  headshot: boolean
  distance?: number
  assistedBy?: string[]

  // Modifiers
  isMultiKill?: boolean
  isStreak?: boolean
  streakCount?: number
  isRevenge?: boolean
  isComeback?: boolean
}

// =============================================================================
// CROSSHAIR DATA
// =============================================================================

/**
 * Crosshair Configuration
 */
export interface CrosshairData {
  id: string
  name: string
  style: CrosshairStyle

  // Appearance
  color: string
  outlineColor?: string
  outlineWidth?: number
  size: number // pixels
  thickness: number // pixels
  gap: number // pixels from center
  opacity: number // 0.0 - 1.0

  // Dynamic behavior
  dynamic: boolean // Expands with spread
  spreadMultiplier?: number // How much it expands

  // Hit marker
  hitMarkerEnabled: boolean
  hitMarkerColor?: string
  hitMarkerDuration?: number // seconds
  hitMarkerSize?: number

  // Center dot
  centerDot: boolean
  centerDotSize?: number
  centerDotColor?: string
}

// =============================================================================
// MINIMAP DATA
// =============================================================================

/**
 * Minimap Configuration
 */
export interface MinimapData {
  id: string
  name: string

  // Size and position
  size: number // pixels (square)
  position: UIPosition
  offset: { x: number; y: number }

  // Appearance
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  opacity: number

  // Behavior
  rotateWithPlayer: boolean
  zoom: number // 0.5 - 2.0
  updateRate: number // Hz

  // Icons
  playerIcon: {
    shape: 'triangle' | 'circle' | 'square'
    color: string
    size: number
  }
  enemyIcon: {
    shape: 'triangle' | 'circle' | 'square'
    color: string
    size: number
  }
  allyIcon: {
    shape: 'triangle' | 'circle' | 'square'
    color: string
    size: number
  }
  objectiveIcon: {
    shape: 'triangle' | 'circle' | 'square' | 'star'
    color: string
    size: number
  }

  // Grid
  showGrid: boolean
  gridColor?: string
  gridSpacing?: number

  // Compass
  showCompass: boolean
  compassColor?: string
}

// =============================================================================
// PERFORMANCE METRICS DATA
// =============================================================================

/**
 * Performance Display Configuration
 */
export interface PerformanceDisplayData {
  id: string
  name: string
  enabled: boolean

  // What to show
  showFPS: boolean
  showFrameTime: boolean
  showPing: boolean
  showMemory: boolean
  showDrawCalls: boolean
  showTriangles: boolean

  // Appearance
  position: UIPosition
  backgroundColor: string
  textColor: string
  fontSize: number
  opacity: number

  // Update rate
  updateRate: number // Hz

  // Thresholds (for color coding)
  fpsThresholds: {
    good: number // >= this = green
    ok: number // >= this = yellow
    bad: number // < this = red
  }
  pingThresholds: {
    good: number // <= this = green
    ok: number // <= this = yellow
    bad: number // > this = red
  }
}

// =============================================================================
// PRESET DATA
// =============================================================================

/**
 * Default GLXY Theme
 */
export const GLXY_THEME: UIThemeData = {
  id: 'glxy',
  name: 'GLXY',
  description: 'Official GLXY Gaming theme with vibrant colors',
  colors: {
    primary: '#ff6b35',
    secondary: '#00d4ff',
    background: 'rgba(0, 0, 0, 0.9)',
    backgroundSecondary: 'rgba(20, 20, 20, 0.85)',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#ff6b35',
    success: '#00ff00',
    warning: '#ffaa00',
    error: '#ff4444',
    info: '#00d4ff',
    health: '#ff4444',
    armor: '#4444ff',
    stamina: '#00ff00',
    ammo: '#ff8800'
  },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSizeBase: 14,
  fontSizeSmall: 12,
  fontSizeLarge: 18,
  fontWeightNormal: 400,
  fontWeightBold: 700,
  spacingSmall: 8,
  spacingMedium: 16,
  spacingLarge: 24,
  borderRadius: 8,
  borderWidth: 2,
  shadowEnabled: true,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 10,
  blurEnabled: true,
  blurAmount: 10,
  animationDuration: 0.3,
  animationEasing: 'ease-out'
}

/**
 * Cyberpunk Theme
 */
export const CYBERPUNK_THEME: UIThemeData = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon-lit cyberpunk aesthetic',
  colors: {
    primary: '#00ff00',
    secondary: '#ff00ff',
    background: 'rgba(0, 0, 0, 0.95)',
    backgroundSecondary: 'rgba(10, 0, 20, 0.9)',
    text: '#00ff00',
    textSecondary: '#00cc00',
    border: '#00ff00',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    health: '#ff00ff',
    armor: '#00ffff',
    stamina: '#ffff00',
    ammo: '#ff00ff'
  },
  fontFamily: "'Orbitron', 'Courier New', monospace",
  fontSizeBase: 14,
  fontSizeSmall: 12,
  fontSizeLarge: 18,
  fontWeightNormal: 400,
  fontWeightBold: 700,
  spacingSmall: 8,
  spacingMedium: 16,
  spacingLarge: 24,
  borderRadius: 4,
  borderWidth: 2,
  shadowEnabled: true,
  shadowColor: 'rgba(0, 255, 0, 0.5)',
  shadowBlur: 20,
  blurEnabled: false,
  blurAmount: 0,
  animationDuration: 0.2,
  animationEasing: 'linear'
}

/**
 * Military Theme
 */
export const MILITARY_THEME: UIThemeData = {
  id: 'military',
  name: 'Military',
  description: 'Tactical military theme',
  colors: {
    primary: '#8b7355',
    secondary: '#4a5f4a',
    background: 'rgba(0, 0, 0, 0.85)',
    backgroundSecondary: 'rgba(40, 40, 30, 0.8)',
    text: '#d4af37',
    textSecondary: '#a0a080',
    border: '#8b7355',
    success: '#4a5f4a',
    warning: '#ff8800',
    error: '#aa0000',
    info: '#6b8e9f',
    health: '#8b0000',
    armor: '#4a5f4a',
    stamina: '#d4af37',
    ammo: '#8b7355'
  },
  fontFamily: "'Roboto Mono', 'Courier New', monospace",
  fontSizeBase: 13,
  fontSizeSmall: 11,
  fontSizeLarge: 16,
  fontWeightNormal: 400,
  fontWeightBold: 700,
  spacingSmall: 6,
  spacingMedium: 12,
  spacingLarge: 18,
  borderRadius: 2,
  borderWidth: 1,
  shadowEnabled: false,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowBlur: 0,
  blurEnabled: false,
  blurAmount: 0,
  animationDuration: 0.15,
  animationEasing: 'ease-in-out'
}

/**
 * All UI Themes
 */
export const UI_THEMES: UIThemeData[] = [
  GLXY_THEME,
  CYBERPUNK_THEME,
  MILITARY_THEME
]

/**
 * Default Crosshair
 */
export const DEFAULT_CROSSHAIR: CrosshairData = {
  id: 'default',
  name: 'Default Cross',
  style: CrosshairStyle.CROSS,
  color: '#00ff00',
  outlineColor: '#000000',
  outlineWidth: 1,
  size: 20,
  thickness: 2,
  gap: 4,
  opacity: 0.8,
  dynamic: true,
  spreadMultiplier: 1.5,
  hitMarkerEnabled: true,
  hitMarkerColor: '#ffffff',
  hitMarkerDuration: 0.2,
  hitMarkerSize: 30,
  centerDot: true,
  centerDotSize: 2,
  centerDotColor: '#00ff00'
}

/**
 * Dot Crosshair
 */
export const DOT_CROSSHAIR: CrosshairData = {
  id: 'dot',
  name: 'Simple Dot',
  style: CrosshairStyle.DOT,
  color: '#00ff00',
  outlineColor: '#000000',
  outlineWidth: 1,
  size: 4,
  thickness: 4,
  gap: 0,
  opacity: 1.0,
  dynamic: false,
  hitMarkerEnabled: true,
  hitMarkerColor: '#ffffff',
  hitMarkerDuration: 0.15,
  hitMarkerSize: 20,
  centerDot: true,
  centerDotSize: 4,
  centerDotColor: '#00ff00'
}

/**
 * Circle Crosshair
 */
export const CIRCLE_CROSSHAIR: CrosshairData = {
  id: 'circle',
  name: 'Circle',
  style: CrosshairStyle.CIRCLE,
  color: '#00ff00',
  outlineColor: '#000000',
  outlineWidth: 1,
  size: 24,
  thickness: 2,
  gap: 0,
  opacity: 0.7,
  dynamic: true,
  spreadMultiplier: 2.0,
  hitMarkerEnabled: true,
  hitMarkerColor: '#ff0000',
  hitMarkerDuration: 0.25,
  hitMarkerSize: 35,
  centerDot: true,
  centerDotSize: 2,
  centerDotColor: '#00ff00'
}

/**
 * All Crosshairs
 */
export const CROSSHAIR_PRESETS: CrosshairData[] = [
  DEFAULT_CROSSHAIR,
  DOT_CROSSHAIR,
  CIRCLE_CROSSHAIR
]

/**
 * Default Minimap Configuration
 */
export const DEFAULT_MINIMAP: MinimapData = {
  id: 'default',
  name: 'Default Minimap',
  size: 200,
  position: UIPosition.TOP_RIGHT,
  offset: { x: -20, y: 20 },
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderColor: '#00ff00',
  borderWidth: 2,
  borderRadius: 10,
  opacity: 1.0,
  rotateWithPlayer: false,
  zoom: 1.0,
  updateRate: 10,
  playerIcon: {
    shape: 'triangle',
    color: '#00ff00',
    size: 8
  },
  enemyIcon: {
    shape: 'square',
    color: '#ff0000',
    size: 6
  },
  allyIcon: {
    shape: 'circle',
    color: '#0088ff',
    size: 6
  },
  objectiveIcon: {
    shape: 'star',
    color: '#ffaa00',
    size: 10
  },
  showGrid: true,
  gridColor: 'rgba(100, 100, 100, 0.5)',
  gridSpacing: 50,
  showCompass: true,
  compassColor: 'rgba(255, 255, 255, 0.6)'
}

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

/**
 * Kill Notification
 */
export const KILL_NOTIFICATION: NotificationTemplate = {
  id: 'kill',
  type: NotificationType.KILL,
  icon: '💀',
  color: '#ff8800',
  title: 'Elimination',
  message: 'You eliminated {victim}',
  duration: 3.0,
  priority: 5,
  animationType: UIAnimationType.SLIDE,
  animationDuration: 0.3,
  animationEasing: 'ease-out',
  sound: 'kill',
  soundVolume: 0.7,
  haptic: true,
  hapticPattern: [50, 50, 50]
}

/**
 * Headshot Notification
 */
export const HEADSHOT_NOTIFICATION: NotificationTemplate = {
  id: 'headshot',
  type: NotificationType.HEADSHOT,
  icon: '🎯',
  color: '#ff0000',
  title: 'HEADSHOT',
  message: 'Eliminated {victim} with a headshot!',
  duration: 4.0,
  priority: 8,
  animationType: UIAnimationType.BOUNCE,
  animationDuration: 0.5,
  animationEasing: 'ease-out',
  sound: 'headshot',
  soundVolume: 0.9,
  haptic: true,
  hapticPattern: [100, 50, 100]
}

/**
 * Multi-Kill Notification
 */
export const MULTIKILL_NOTIFICATION: NotificationTemplate = {
  id: 'multikill',
  type: NotificationType.MULTI_KILL,
  icon: '🔥',
  color: '#ff00ff',
  title: 'MULTI KILL',
  message: '{count} eliminations in quick succession!',
  duration: 5.0,
  priority: 9,
  animationType: UIAnimationType.SCALE,
  animationDuration: 0.6,
  animationEasing: 'ease-out',
  sound: 'multikill',
  soundVolume: 1.0,
  haptic: true,
  hapticPattern: [100, 50, 100, 50, 100]
}

/**
 * Streak Notification
 */
export const STREAK_NOTIFICATION: NotificationTemplate = {
  id: 'streak',
  type: NotificationType.STREAK,
  icon: '⚡',
  color: '#ffff00',
  title: 'KILLSTREAK',
  message: '{count} elimination streak!',
  duration: 5.0,
  priority: 9,
  animationType: UIAnimationType.GLOW,
  animationDuration: 0.8,
  animationEasing: 'ease-out',
  sound: 'streak',
  soundVolume: 1.0,
  haptic: true,
  hapticPattern: [100, 100, 100]
}

/**
 * Level Up Notification
 */
export const LEVELUP_NOTIFICATION: NotificationTemplate = {
  id: 'levelup',
  type: NotificationType.LEVEL_UP,
  icon: '⭐',
  color: '#00d4ff',
  title: 'LEVEL UP',
  message: 'You reached Level {level}!',
  duration: 6.0,
  priority: 7,
  animationType: UIAnimationType.PULSE,
  animationDuration: 1.0,
  animationEasing: 'ease-out',
  sound: 'levelup',
  soundVolume: 0.8,
  haptic: true,
  hapticPattern: [150, 100, 150]
}

/**
 * Achievement Notification
 */
export const ACHIEVEMENT_NOTIFICATION: NotificationTemplate = {
  id: 'achievement',
  type: NotificationType.ACHIEVEMENT,
  icon: '🏆',
  color: '#ffaa00',
  title: 'ACHIEVEMENT UNLOCKED',
  message: '{achievement}',
  duration: 8.0,
  priority: 10,
  animationType: UIAnimationType.BOUNCE,
  animationDuration: 0.8,
  animationEasing: 'ease-out',
  sound: 'achievement',
  soundVolume: 1.0,
  haptic: true,
  hapticPattern: [200, 100, 200]
}

/**
 * All Notification Templates
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  KILL_NOTIFICATION,
  HEADSHOT_NOTIFICATION,
  MULTIKILL_NOTIFICATION,
  STREAK_NOTIFICATION,
  LEVELUP_NOTIFICATION,
  ACHIEVEMENT_NOTIFICATION
]

// =============================================================================
// KILL FEED TEMPLATES
// =============================================================================

/**
 * Kill Feed Templates
 */
export const KILL_FEED_TEMPLATES: KillFeedTemplate[] = [
  {
    id: 'kill',
    type: KillFeedType.KILL,
    icon: '💀',
    color: '#ffffff',
    format: '{killer} {icon} {victim}',
    duration: 5.0,
    priority: 5,
    animationType: UIAnimationType.SLIDE,
    glowEffect: false
  },
  {
    id: 'headshot',
    type: KillFeedType.HEADSHOT,
    icon: '🎯',
    color: '#ff0000',
    format: '{killer} {icon} [HEADSHOT] {victim}',
    duration: 6.0,
    priority: 8,
    animationType: UIAnimationType.SLIDE,
    glowEffect: true,
    glowColor: '#ff0000',
    particleEffect: false
  },
  {
    id: 'melee',
    type: KillFeedType.MELEE,
    icon: '🔪',
    color: '#ffaa00',
    format: '{killer} {icon} [MELEE] {victim}',
    duration: 5.0,
    priority: 6,
    animationType: UIAnimationType.SLIDE,
    glowEffect: false
  },
  {
    id: 'explosion',
    type: KillFeedType.EXPLOSION,
    icon: '💥',
    color: '#ff8800',
    format: '{killer} {icon} [EXPLOSION] {victim}',
    duration: 5.0,
    priority: 6,
    animationType: UIAnimationType.SLIDE,
    glowEffect: true,
    glowColor: '#ff8800'
  }
]

// =============================================================================
// HUD LAYOUT PRESETS
// =============================================================================

/**
 * Default HUD Layout
 */
export const DEFAULT_HUD_LAYOUT: HUDLayoutData = {
  id: 'default',
  name: 'Default Layout',
  description: 'Standard GLXY FPS HUD layout',
  theme: UITheme.GLXY,
  scale: 1.0,
  elements: [
    // Health Bar (bottom-left)
    {
      id: 'health-bar',
      type: UIElementType.HEALTH_BAR,
      position: UIPosition.BOTTOM_LEFT,
      offset: { x: 20, y: -20 },
      size: { width: 200, height: 30 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: true,
      animationType: UIAnimationType.PULSE,
      animationDuration: 0.5,
      animationLoop: false,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Armor Bar (bottom-left, above health)
    {
      id: 'armor-bar',
      type: UIElementType.ARMOR_BAR,
      position: UIPosition.BOTTOM_LEFT,
      offset: { x: 20, y: -55 },
      size: { width: 200, height: 20 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: false,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Stamina Bar (bottom-right)
    {
      id: 'stamina-bar',
      type: UIElementType.STAMINA_BAR,
      position: UIPosition.BOTTOM_RIGHT,
      offset: { x: -20, y: -45 },
      size: { width: 180, height: 16 },
      visible: true,
      enabled: true,
      opacity: 0.9,
      scale: 1.0,
      zIndex: 100,
      animated: true,
      animationType: UIAnimationType.FADE,
      animationDuration: 0.3,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Ammo Display (bottom-center)
    {
      id: 'ammo-display',
      type: UIElementType.AMMO_DISPLAY,
      position: UIPosition.BOTTOM_CENTER,
      offset: { x: 0, y: -30 },
      size: { width: 120, height: 60 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: true,
      animationType: UIAnimationType.SCALE,
      animationDuration: 0.2,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Crosshair (center)
    {
      id: 'crosshair',
      type: UIElementType.CROSSHAIR,
      position: UIPosition.CENTER,
      offset: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
      visible: true,
      enabled: true,
      opacity: 0.8,
      scale: 1.0,
      zIndex: 1000,
      animated: true,
      animationType: UIAnimationType.SCALE,
      animationDuration: 0.1,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Minimap (top-right)
    {
      id: 'minimap',
      type: UIElementType.MINIMAP,
      position: UIPosition.TOP_RIGHT,
      offset: { x: -20, y: 20 },
      size: { width: 200, height: 200 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: false,
      interactive: true,
      theme: UITheme.GLXY
    },
    // Kill Feed (top-right, below minimap)
    {
      id: 'kill-feed',
      type: UIElementType.KILL_FEED,
      position: UIPosition.TOP_RIGHT,
      offset: { x: -20, y: 230 },
      size: { width: 300, height: 200 },
      visible: true,
      enabled: true,
      opacity: 0.9,
      scale: 1.0,
      zIndex: 100,
      animated: true,
      animationType: UIAnimationType.SLIDE,
      animationDuration: 0.3,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Timer (top-center)
    {
      id: 'timer',
      type: UIElementType.TIMER,
      position: UIPosition.TOP_CENTER,
      offset: { x: 0, y: 90 },
      size: { width: 120, height: 40 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: false,
      interactive: false,
      theme: UITheme.GLXY
    },
    // Objective Tracker (top-left)
    {
      id: 'objective-tracker',
      type: UIElementType.OBJECTIVE_TRACKER,
      position: UIPosition.TOP_LEFT,
      offset: { x: 20, y: 20 },
      size: { width: 250, height: 100 },
      visible: true,
      enabled: true,
      opacity: 1.0,
      scale: 1.0,
      zIndex: 100,
      animated: false,
      interactive: false,
      theme: UITheme.GLXY
    }
  ]
}

/**
 * Minimal HUD Layout
 */
export const MINIMAL_HUD_LAYOUT: HUDLayoutData = {
  id: 'minimal',
  name: 'Minimal Layout',
  description: 'Minimal HUD with only essential elements',
  theme: UITheme.MINIMAL,
  scale: 0.9,
  elements: [
    // Health Bar (bottom-left, smaller)
    {
      id: 'health-bar',
      type: UIElementType.HEALTH_BAR,
      position: UIPosition.BOTTOM_LEFT,
      offset: { x: 15, y: -15 },
      size: { width: 150, height: 20 },
      visible: true,
      enabled: true,
      opacity: 0.8,
      scale: 0.9,
      zIndex: 100,
      animated: false,
      interactive: false,
      theme: UITheme.MINIMAL
    },
    // Ammo Display (bottom-right)
    {
      id: 'ammo-display',
      type: UIElementType.AMMO_DISPLAY,
      position: UIPosition.BOTTOM_RIGHT,
      offset: { x: -15, y: -15 },
      size: { width: 80, height: 40 },
      visible: true,
      enabled: true,
      opacity: 0.8,
      scale: 0.9,
      zIndex: 100,
      animated: false,
      interactive: false,
      theme: UITheme.MINIMAL
    },
    // Crosshair (center)
    {
      id: 'crosshair',
      type: UIElementType.CROSSHAIR,
      position: UIPosition.CENTER,
      offset: { x: 0, y: 0 },
      size: { width: 40, height: 40 },
      visible: true,
      enabled: true,
      opacity: 0.7,
      scale: 0.9,
      zIndex: 1000,
      animated: false,
      interactive: false,
      theme: UITheme.MINIMAL
    }
  ]
}

/**
 * All HUD Layouts
 */
export const HUD_LAYOUTS: HUDLayoutData[] = [
  DEFAULT_HUD_LAYOUT,
  MINIMAL_HUD_LAYOUT
]

// =============================================================================
// PERFORMANCE DISPLAY DATA
// =============================================================================

/**
 * Default Performance Display
 */
export const DEFAULT_PERFORMANCE_DISPLAY: PerformanceDisplayData = {
  id: 'default',
  name: 'Default Performance Display',
  enabled: false, // Disabled by default
  showFPS: true,
  showFrameTime: true,
  showPing: true,
  showMemory: true,
  showDrawCalls: false,
  showTriangles: false,
  position: UIPosition.TOP_LEFT,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: '#00ff00',
  fontSize: 12,
  opacity: 0.9,
  updateRate: 1, // 1 Hz
  fpsThresholds: {
    good: 60,
    ok: 30,
    bad: 0
  },
  pingThresholds: {
    good: 50,
    ok: 100,
    bad: 200
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get UI Theme by ID
 */
export function getUITheme(id: string): UIThemeData | undefined {
  return UI_THEMES.find(theme => theme.id === id)
}

/**
 * Get Crosshair by ID
 */
export function getCrosshair(id: string): CrosshairData | undefined {
  return CROSSHAIR_PRESETS.find(crosshair => crosshair.id === id)
}

/**
 * Get Notification Template by Type
 */
export function getNotificationTemplate(type: NotificationType): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find(template => template.type === type)
}

/**
 * Get Kill Feed Template by Type
 */
export function getKillFeedTemplate(type: KillFeedType): KillFeedTemplate | undefined {
  return KILL_FEED_TEMPLATES.find(template => template.type === type)
}

/**
 * Get HUD Layout by ID
 */
export function getHUDLayout(id: string): HUDLayoutData | undefined {
  return HUD_LAYOUTS.find(layout => layout.id === id)
}

/**
 * Create Custom Notification Template
 */
export function createNotificationTemplate(
  type: NotificationType,
  message: string,
  options: Partial<NotificationTemplate> = {}
): NotificationTemplate {
  const baseTemplate = getNotificationTemplate(type) || KILL_NOTIFICATION

  return {
    ...baseTemplate,
    ...options,
    message,
    id: `custom-${Date.now()}`
  }
}

/**
 * Create Custom Kill Feed Entry
 */
export function createKillFeedEntry(
  killer: string,
  victim: string,
  weapon: string,
  options: Partial<KillFeedEntry> = {}
): KillFeedEntry {
  return {
    id: `kill-${Date.now()}`,
    timestamp: Date.now(),
    type: KillFeedType.KILL,
    killer,
    victim,
    weapon,
    headshot: false,
    ...options
  }
}

/**
 * Format Kill Feed Entry
 */
export function formatKillFeedEntry(entry: KillFeedEntry, template: KillFeedTemplate): string {
  let formatted = template.format

  formatted = formatted.replace('{killer}', entry.killer)
  formatted = formatted.replace('{victim}', entry.victim)
  formatted = formatted.replace('{icon}', template.icon)
  formatted = formatted.replace('{weapon}', entry.weapon)

  if (entry.headshot) {
    formatted = formatted.replace('[HEADSHOT]', '🎯 HEADSHOT')
  } else {
    formatted = formatted.replace('[HEADSHOT]', '')
  }

  if (entry.distance) {
    formatted += ` (${Math.round(entry.distance)}m)`
  }

  return formatted.trim()
}
