/**
 * MapEditorData.ts
 *
 * COMPLETE MAP EDITOR DATA ARCHITECTURE
 *
 * Professional in-game map editor for creating and editing FPS maps.
 * Supports terrain editing, object placement, lighting, spawns, objectives, and more.
 *
 * Features:
 * - 10 Editor Modes (Select, Move, Rotate, Scale, Paint, Terrain, etc.)
 * - 8 Tool Types (Geometry, Props, Spawns, Objectives, Zones, Lights, etc.)
 * - 3 Gizmo Types (Translate, Rotate, Scale)
 * - Grid & Snap System
 * - Layer Management
 * - Undo/Redo History (50 actions)
 * - Brush System for terrain editing
 * - Material & Texture Library
 * - Object Templates
 * - Map Metadata
 * - Auto-save system
 *
 * @module MapEditorData
 * @category Editor
 * @subcategory Data
 */

import type { Vector3 } from 'three'
import type {
  MapData,
  MapTheme,
  MapSize,
  TimeOfDay,
  WeatherType,
  SpawnPointData,
  ObjectiveData,
  ZoneData,
  InteractiveElementData
} from '../../maps/data/MapData'
import { MaterialType } from '../../maps/data/MapData'

// ============================================================================
// EDITOR MODES
// ============================================================================

/**
 * Editor operation modes
 */
export enum EditorMode {
  SELECT = 'select',           // Select and manipulate objects
  MOVE = 'move',              // Move objects
  ROTATE = 'rotate',          // Rotate objects
  SCALE = 'scale',            // Scale objects
  PAINT = 'paint',            // Paint textures
  TERRAIN = 'terrain',        // Edit terrain height
  VERTEX = 'vertex',          // Edit vertices
  SPAWN = 'spawn',            // Place spawn points
  OBJECTIVE = 'objective',    // Place objectives
  ZONE = 'zone'               // Create zones
}

/**
 * Editor tool types
 */
export enum EditorTool {
  GEOMETRY = 'geometry',           // Place geometry objects
  PROPS = 'props',                // Place props and decorations
  INTERACTIVE = 'interactive',     // Place interactive elements
  SPAWNS = 'spawns',              // Place spawn points
  OBJECTIVES = 'objectives',       // Place objectives
  ZONES = 'zones',                // Create zones
  LIGHTS = 'lights',              // Place lights
  SOUNDS = 'sounds',              // Place sound sources
  NAVMESH = 'navmesh',            // Edit navigation mesh
  EFFECTS = 'effects'             // Place particle effects
}

/**
 * Gizmo manipulation types
 */
export enum GizmoType {
  TRANSLATE = 'translate',  // Position gizmo
  ROTATE = 'rotate',       // Rotation gizmo
  SCALE = 'scale'          // Scale gizmo
}

/**
 * Transform space
 */
export enum TransformSpace {
  WORLD = 'world',    // World space coordinates
  LOCAL = 'local'     // Local space coordinates
}

// ============================================================================
// GRID & SNAP SETTINGS
// ============================================================================

/**
 * Grid snap settings
 */
export interface GridSettings {
  enabled: boolean
  size: number              // Grid cell size (meters)
  divisions: number         // Subdivisions per cell
  visible: boolean          // Show grid in viewport
  color: string            // Grid line color
  centerLineColor: string  // Center axis color
  opacity: number          // Grid opacity (0-1)
}

/**
 * Snap settings for precision placement
 */
export interface SnapSettings {
  snapToGrid: boolean      // Snap position to grid
  snapToAngle: boolean     // Snap rotation to angle increments
  snapToScale: boolean     // Snap scale to increments
  gridSize: number         // Grid snap size (meters)
  angleIncrement: number   // Rotation snap angle (degrees)
  scaleIncrement: number   // Scale snap increment
  snapToObjects: boolean   // Snap to other objects
  snapDistance: number     // Distance threshold for object snapping
}

/**
 * Default grid settings
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: true,
  size: 1.0,
  divisions: 10,
  visible: true,
  color: '#888888',
  centerLineColor: '#444444',
  opacity: 0.5
}

/**
 * Default snap settings
 */
export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  snapToGrid: true,
  snapToAngle: true,
  snapToScale: false,
  gridSize: 0.5,
  angleIncrement: 15,
  scaleIncrement: 0.1,
  snapToObjects: true,
  snapDistance: 0.5
}

// ============================================================================
// SELECTION SYSTEM
// ============================================================================

/**
 * Selection mode
 */
export enum SelectionMode {
  SINGLE = 'single',      // Select one object at a time
  MULTIPLE = 'multiple',  // Select multiple objects
  ADDITIVE = 'additive',  // Add to selection
  SUBTRACT = 'subtract'   // Remove from selection
}

/**
 * Selection filter
 */
export interface SelectionFilter {
  geometryEnabled: boolean
  propsEnabled: boolean
  spawnsEnabled: boolean
  objectivesEnabled: boolean
  zonesEnabled: boolean
  lightsEnabled: boolean
  lockedObjectsSelectable: boolean
}

/**
 * Selected object data
 */
export interface SelectedObject {
  id: string
  type: EditorTool
  position: Vector3
  rotation: Vector3
  scale: Vector3
  locked: boolean
  visible: boolean
  layer: string
  userData: Record<string, unknown>
}

// ============================================================================
// LAYER SYSTEM
// ============================================================================

/**
 * Editor layer for organizing objects
 */
export interface EditorLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
  objects: string[]  // Object IDs in this layer
}

/**
 * Default editor layers
 */
export const DEFAULT_LAYERS: EditorLayer[] = [
  {
    id: 'layer-geometry',
    name: 'Geometry',
    visible: true,
    locked: false,
    color: '#4CAF50',
    objects: []
  },
  {
    id: 'layer-props',
    name: 'Props',
    visible: true,
    locked: false,
    color: '#2196F3',
    objects: []
  },
  {
    id: 'layer-gameplay',
    name: 'Gameplay',
    visible: true,
    locked: false,
    color: '#FF9800',
    objects: []
  },
  {
    id: 'layer-lighting',
    name: 'Lighting',
    visible: true,
    locked: false,
    color: '#FFC107',
    objects: []
  }
]

// ============================================================================
// HISTORY SYSTEM (Undo/Redo)
// ============================================================================

/**
 * Editor action types
 */
export enum EditorActionType {
  CREATE = 'create',
  DELETE = 'delete',
  MOVE = 'move',
  ROTATE = 'rotate',
  SCALE = 'scale',
  MODIFY = 'modify',
  MULTI = 'multi'  // Multiple actions grouped together
}

/**
 * Editor history action
 */
export interface EditorAction {
  type: EditorActionType
  timestamp: number
  description: string
  undo: () => void
  redo: () => void
  data?: Record<string, unknown>
}

/**
 * History settings
 */
export interface HistorySettings {
  maxActions: number      // Maximum actions to keep in history
  autoGroup: boolean      // Automatically group similar actions
  groupTimeout: number    // Time window for auto-grouping (ms)
}

/**
 * Default history settings
 */
export const DEFAULT_HISTORY_SETTINGS: HistorySettings = {
  maxActions: 50,
  autoGroup: true,
  groupTimeout: 1000
}

// ============================================================================
// BRUSH SYSTEM (Terrain & Paint)
// ============================================================================

/**
 * Brush shape for terrain/paint editing
 */
export enum BrushShape {
  CIRCLE = 'circle',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  CUSTOM = 'custom'
}

/**
 * Brush falloff type
 */
export enum BrushFalloff {
  LINEAR = 'linear',
  SMOOTH = 'smooth',
  SPHERICAL = 'spherical',
  SHARP = 'sharp',
  CONSTANT = 'constant'
}

/**
 * Terrain brush settings
 */
export interface TerrainBrushSettings {
  shape: BrushShape
  size: number              // Brush radius (meters)
  strength: number          // Brush strength (0-1)
  falloff: BrushFalloff
  spacing: number           // Brush stroke spacing (0-1)
  jitter: number           // Random position jitter (0-1)
  rotation: number         // Brush rotation (degrees)
  flatten: boolean         // Flatten instead of raise/lower
  flattenHeight: number    // Target height for flatten
}

/**
 * Paint brush settings
 */
export interface PaintBrushSettings {
  shape: BrushShape
  size: number
  opacity: number          // Paint opacity (0-1)
  flow: number            // Paint flow rate (0-1)
  falloff: BrushFalloff
  blendMode: 'replace' | 'mix' | 'add' | 'multiply'
  spacing: number
  jitter: number
  rotation: number
}

/**
 * Default terrain brush settings
 */
export const DEFAULT_TERRAIN_BRUSH: TerrainBrushSettings = {
  shape: BrushShape.CIRCLE,
  size: 5.0,
  strength: 0.5,
  falloff: BrushFalloff.SMOOTH,
  spacing: 0.25,
  jitter: 0.0,
  rotation: 0,
  flatten: false,
  flattenHeight: 0
}

/**
 * Default paint brush settings
 */
export const DEFAULT_PAINT_BRUSH: PaintBrushSettings = {
  shape: BrushShape.CIRCLE,
  size: 2.0,
  opacity: 1.0,
  flow: 0.5,
  falloff: BrushFalloff.SMOOTH,
  blendMode: 'mix',
  spacing: 0.25,
  jitter: 0.0,
  rotation: 0
}

// ============================================================================
// MATERIAL & TEXTURE LIBRARY
// ============================================================================

/**
 * Material library entry
 */
export interface MaterialLibraryEntry {
  id: string
  name: string
  category: 'terrain' | 'structure' | 'prop' | 'special'
  materialType: MaterialType
  textures: {
    diffuse?: string
    normal?: string
    roughness?: string
    metalness?: string
    ao?: string
    emissive?: string
  }
  properties: {
    roughness: number
    metalness: number
    color: string
    emissive?: string
    emissiveIntensity?: number
  }
  thumbnail?: string
}

/**
 * Texture library entry
 */
export interface TextureLibraryEntry {
  id: string
  name: string
  category: string
  path: string
  resolution: number
  tiling: { x: number; y: number }
  thumbnail?: string
}

// ============================================================================
// OBJECT TEMPLATES
// ============================================================================

/**
 * Object template category
 */
export enum TemplateCategory {
  WALLS = 'walls',
  FLOORS = 'floors',
  STAIRS = 'stairs',
  RAMPS = 'ramps',
  PLATFORMS = 'platforms',
  COVER = 'cover',
  PROPS = 'props',
  BUILDINGS = 'buildings',
  VEGETATION = 'vegetation',
  INTERACTIVE = 'interactive'
}

/**
 * Object template for quick placement
 */
export interface ObjectTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  thumbnail?: string
  prefab: {
    geometry?: Record<string, any>
    interactive?: Partial<InteractiveElementData>
    customData?: Record<string, unknown>
  }
  defaultScale: Vector3
  snapPoints?: Vector3[]  // Snap points for connecting objects
}

// ============================================================================
// CAMERA SETTINGS
// ============================================================================

/**
 * Editor camera settings
 */
export interface EditorCameraSettings {
  position: Vector3
  target: Vector3
  fov: number
  near: number
  far: number
  moveSpeed: number
  rotateSpeed: number
  zoomSpeed: number
  enableDamping: boolean
  dampingFactor: number
}

/**
 * Default editor camera settings
 */
export const DEFAULT_CAMERA_SETTINGS: EditorCameraSettings = {
  position: { x: 0, y: 50, z: 50 } as Vector3,
  target: { x: 0, y: 0, z: 0 } as Vector3,
  fov: 60,
  near: 0.1,
  far: 10000,
  moveSpeed: 10,
  rotateSpeed: 1,
  zoomSpeed: 2,
  enableDamping: true,
  dampingFactor: 0.1
}

// ============================================================================
// VIEWPORT SETTINGS
// ============================================================================

/**
 * Viewport rendering mode
 */
export enum ViewportRenderMode {
  SHADED = 'shaded',           // Full shading
  WIREFRAME = 'wireframe',     // Wireframe only
  SHADED_WIREFRAME = 'shaded_wireframe',  // Both
  TEXTURED = 'textured',       // With textures
  UNLIT = 'unlit',            // No lighting
  LIGHTING_ONLY = 'lighting_only'  // Show lighting only
}

/**
 * Viewport settings
 */
export interface ViewportSettings {
  renderMode: ViewportRenderMode
  showGrid: boolean
  showGizmos: boolean
  showBounds: boolean
  showWireframe: boolean
  showNormals: boolean
  showColliders: boolean
  showSpawnPoints: boolean
  showObjectives: boolean
  showZones: boolean
  showLights: boolean
  showSounds: boolean
  showNavMesh: boolean
  backgroundColor: string
  ambientLightIntensity: number
}

/**
 * Default viewport settings
 */
export const DEFAULT_VIEWPORT_SETTINGS: ViewportSettings = {
  renderMode: ViewportRenderMode.TEXTURED,
  showGrid: true,
  showGizmos: true,
  showBounds: false,
  showWireframe: false,
  showNormals: false,
  showColliders: true,
  showSpawnPoints: true,
  showObjectives: true,
  showZones: true,
  showLights: true,
  showSounds: false,
  showNavMesh: false,
  backgroundColor: '#1a1a1a',
  ambientLightIntensity: 0.4
}

// ============================================================================
// MAP EDITOR STATE
// ============================================================================

/**
 * Complete map editor state
 */
export interface MapEditorState {
  // Current map being edited
  map: MapData | null
  mapModified: boolean

  // Editor mode and tools
  mode: EditorMode
  tool: EditorTool
  gizmoType: GizmoType
  transformSpace: TransformSpace

  // Selection
  selectedObjects: SelectedObject[]
  selectionMode: SelectionMode
  selectionFilter: SelectionFilter

  // Grid and snapping
  gridSettings: GridSettings
  snapSettings: SnapSettings

  // Layers
  layers: EditorLayer[]
  activeLayer: string

  // History
  history: EditorAction[]
  historyIndex: number
  historySettings: HistorySettings

  // Brushes
  terrainBrush: TerrainBrushSettings
  paintBrush: PaintBrushSettings

  // Camera and viewport
  cameraSettings: EditorCameraSettings
  viewportSettings: ViewportSettings

  // Templates and libraries
  objectTemplates: ObjectTemplate[]
  materialLibrary: MaterialLibraryEntry[]
  textureLibrary: TextureLibraryEntry[]

  // Auto-save
  autoSaveEnabled: boolean
  autoSaveInterval: number  // seconds
  lastSaveTime: number
}

// ============================================================================
// EDITOR EVENTS
// ============================================================================

/**
 * Map editor event types
 */
export enum MapEditorEventType {
  // Map events
  MAP_LOADED = 'map_loaded',
  MAP_SAVED = 'map_saved',
  MAP_MODIFIED = 'map_modified',
  MAP_CLOSED = 'map_closed',

  // Object events
  OBJECT_CREATED = 'object_created',
  OBJECT_DELETED = 'object_deleted',
  OBJECT_MODIFIED = 'object_modified',
  OBJECT_SELECTED = 'object_selected',
  OBJECT_DESELECTED = 'object_deselected',

  // Editor events
  MODE_CHANGED = 'mode_changed',
  TOOL_CHANGED = 'tool_changed',
  GIZMO_CHANGED = 'gizmo_changed',

  // History events
  ACTION_EXECUTED = 'action_executed',
  UNDO = 'undo',
  REDO = 'redo',

  // View events
  VIEWPORT_CHANGED = 'viewport_changed',
  CAMERA_MOVED = 'camera_moved',

  // Layer events
  LAYER_ADDED = 'layer_added',
  LAYER_REMOVED = 'layer_removed',
  LAYER_CHANGED = 'layer_changed'
}

/**
 * Map editor event
 */
export interface MapEditorEvent {
  type: MapEditorEventType
  timestamp: number
  data?: Record<string, unknown>
}

// ============================================================================
// EDITOR CONFIGURATION
// ============================================================================

/**
 * Map editor configuration
 */
export interface MapEditorConfig {
  // UI
  showToolbar: boolean
  showProperties: boolean
  showLayers: boolean
  showAssets: boolean
  showConsole: boolean

  // Performance
  maxObjectsInView: number
  lodEnabled: boolean
  shadowsEnabled: boolean

  // Validation
  validateOnSave: boolean
  warnOnLargeFiles: boolean
  maxMapSize: number  // MB

  // Keyboard shortcuts
  shortcuts: Record<string, string>

  // Autosave
  autoSave: boolean
  autoSaveInterval: number  // seconds
}

/**
 * Default editor configuration
 */
export const DEFAULT_EDITOR_CONFIG: MapEditorConfig = {
  showToolbar: true,
  showProperties: true,
  showLayers: true,
  showAssets: true,
  showConsole: false,

  maxObjectsInView: 5000,
  lodEnabled: true,
  shadowsEnabled: true,

  validateOnSave: true,
  warnOnLargeFiles: true,
  maxMapSize: 50,

  shortcuts: {
    'ctrl+s': 'save',
    'ctrl+z': 'undo',
    'ctrl+y': 'redo',
    'ctrl+shift+z': 'redo',
    'ctrl+d': 'duplicate',
    'del': 'delete',
    'ctrl+a': 'selectAll',
    'w': 'moveMode',
    'e': 'rotateMode',
    'r': 'scaleMode',
    'q': 'selectMode',
    'g': 'toggleGrid',
    'f': 'focusSelected',
    'ctrl+g': 'group',
    'ctrl+shift+g': 'ungroup'
  },

  autoSave: true,
  autoSaveInterval: 300  // 5 minutes
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create default map editor state
 */
export function createDefaultEditorState(): MapEditorState {
  return {
    map: null,
    mapModified: false,

    mode: EditorMode.SELECT,
    tool: EditorTool.GEOMETRY,
    gizmoType: GizmoType.TRANSLATE,
    transformSpace: TransformSpace.WORLD,

    selectedObjects: [],
    selectionMode: SelectionMode.SINGLE,
    selectionFilter: {
      geometryEnabled: true,
      propsEnabled: true,
      spawnsEnabled: true,
      objectivesEnabled: true,
      zonesEnabled: true,
      lightsEnabled: true,
      lockedObjectsSelectable: false
    },

    gridSettings: { ...DEFAULT_GRID_SETTINGS },
    snapSettings: { ...DEFAULT_SNAP_SETTINGS },

    layers: DEFAULT_LAYERS.map(layer => ({ ...layer, objects: [] })),
    activeLayer: 'layer-geometry',

    history: [],
    historyIndex: -1,
    historySettings: { ...DEFAULT_HISTORY_SETTINGS },

    terrainBrush: { ...DEFAULT_TERRAIN_BRUSH },
    paintBrush: { ...DEFAULT_PAINT_BRUSH },

    cameraSettings: { ...DEFAULT_CAMERA_SETTINGS },
    viewportSettings: { ...DEFAULT_VIEWPORT_SETTINGS },

    objectTemplates: [],
    materialLibrary: [],
    textureLibrary: [],

    autoSaveEnabled: true,
    autoSaveInterval: 300,
    lastSaveTime: Date.now()
  }
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Snap vector to grid
 */
export function snapVectorToGrid(vector: Vector3, gridSize: number): Vector3 {
  return {
    x: snapToGrid(vector.x, gridSize),
    y: snapToGrid(vector.y, gridSize),
    z: snapToGrid(vector.z, gridSize)
  } as Vector3
}

/**
 * Snap angle to increment
 */
export function snapAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment
}

/**
 * Snap vector rotation to angle increment
 */
export function snapVectorAngles(vector: Vector3, increment: number): Vector3 {
  return {
    x: snapAngle(vector.x, increment),
    y: snapAngle(vector.y, increment),
    z: snapAngle(vector.z, increment)
  } as Vector3
}

/**
 * Check if two positions are within snap distance
 */
export function withinSnapDistance(
  pos1: Vector3,
  pos2: Vector3,
  snapDistance: number
): boolean {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  const dz = pos1.z - pos2.z
  const distSq = dx * dx + dy * dy + dz * dz
  return distSq <= snapDistance * snapDistance
}

/**
 * Generate unique object ID
 */
export function generateObjectId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate map editor state
 */
export function validateEditorState(state: MapEditorState): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check grid settings
  if (state.gridSettings.size <= 0) {
    errors.push('Grid size must be positive')
  }
  if (state.gridSettings.divisions < 1) {
    errors.push('Grid divisions must be at least 1')
  }

  // Check snap settings
  if (state.snapSettings.gridSize <= 0) {
    errors.push('Snap grid size must be positive')
  }
  if (state.snapSettings.angleIncrement <= 0 || state.snapSettings.angleIncrement > 180) {
    errors.push('Snap angle increment must be between 0 and 180')
  }

  // Check brush settings
  if (state.terrainBrush.size <= 0) {
    errors.push('Terrain brush size must be positive')
  }
  if (state.terrainBrush.strength < 0 || state.terrainBrush.strength > 1) {
    errors.push('Terrain brush strength must be between 0 and 1')
  }

  // Check history
  if (state.historySettings.maxActions < 1) {
    errors.push('Max history actions must be at least 1')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate editor statistics
 */
export function calculateEditorStats(state: MapEditorState): {
  totalObjects: number
  selectedObjects: number
  totalLayers: number
  historySize: number
  canUndo: boolean
  canRedo: boolean
} {
  const totalObjects = state.layers.reduce((sum, layer) => sum + layer.objects.length, 0)

  return {
    totalObjects,
    selectedObjects: state.selectedObjects.length,
    totalLayers: state.layers.length,
    historySize: state.history.length,
    canUndo: state.historyIndex >= 0,
    canRedo: state.historyIndex < state.history.length - 1
  }
}

/**
 * Default object templates
 */
export const DEFAULT_OBJECT_TEMPLATES: ObjectTemplate[] = [
  // Walls
  {
    id: 'wall-basic',
    name: 'Basic Wall',
    category: TemplateCategory.WALLS,
    description: 'Standard wall section',
    prefab: {
      geometry: {
        type: 'wall' as const,
        dimensions: { x: 4, y: 3, z: 0.2 } as Vector3,
        material: MaterialType.CONCRETE
      }
    },
    defaultScale: { x: 1, y: 1, z: 1 } as Vector3
  },

  // Floors
  {
    id: 'floor-basic',
    name: 'Basic Floor',
    category: TemplateCategory.FLOORS,
    description: 'Standard floor tile',
    prefab: {
      geometry: {
        type: 'floor' as const,
        dimensions: { x: 10, y: 0.1, z: 10 } as Vector3,
        material: MaterialType.CONCRETE
      }
    },
    defaultScale: { x: 1, y: 1, z: 1 } as Vector3
  },

  // Stairs
  {
    id: 'stairs-basic',
    name: 'Basic Stairs',
    category: TemplateCategory.STAIRS,
    description: 'Standard staircase',
    prefab: {
      geometry: {
        type: 'stairs' as const,
        dimensions: { x: 2, y: 3, z: 4 } as Vector3,
        material: MaterialType.CONCRETE
      }
    },
    defaultScale: { x: 1, y: 1, z: 1 } as Vector3
  },

  // Cover
  {
    id: 'cover-crate',
    name: 'Wooden Crate',
    category: TemplateCategory.COVER,
    description: 'Wooden crate for cover',
    prefab: {
      geometry: {
        type: 'obstacle' as const,
        dimensions: { x: 1, y: 1, z: 1 } as Vector3,
        material: MaterialType.WOOD,
        cover: {
          type: 'low' as const,
          canVault: true,
          canLean: false,
          height: 1.0
        }
      }
    },
    defaultScale: { x: 1, y: 1, z: 1 } as Vector3
  }
]
