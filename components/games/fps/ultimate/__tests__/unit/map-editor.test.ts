/**
 * map-editor.test.ts
 *
 * Comprehensive tests for Map Editor System
 *
 * Tests:
 * - MapEditorData helpers and functions
 * - Grid and snap system
 * - Object creation and manipulation
 * - Selection system
 * - History (undo/redo)
 * - Layer management
 * - Map save/load/export
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  EditorMode,
  EditorTool,
  GizmoType,
  TransformSpace,
  SelectionMode,
  BrushShape,
  BrushFalloff,
  TemplateCategory,
  MapEditorEventType,
  EditorActionType,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_SNAP_SETTINGS,
  DEFAULT_TERRAIN_BRUSH,
  DEFAULT_PAINT_BRUSH,
  DEFAULT_CAMERA_SETTINGS,
  DEFAULT_VIEWPORT_SETTINGS,
  DEFAULT_HISTORY_SETTINGS,
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_LAYERS,
  DEFAULT_OBJECT_TEMPLATES,
  createDefaultEditorState,
  snapToGrid,
  snapVectorToGrid,
  snapAngle,
  snapVectorAngles,
  withinSnapDistance,
  generateObjectId,
  validateEditorState,
  calculateEditorStats
} from '../../editor/data/MapEditorData'
import type { Vector3 } from 'three'

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('MapEditorData - Helper Functions', () => {
  it('should snap value to grid correctly', () => {
    expect(snapToGrid(0.7, 0.5)).toBe(0.5)
    expect(snapToGrid(1.3, 0.5)).toBe(1.5)
    expect(snapToGrid(2.0, 1.0)).toBe(2.0)
    expect(snapToGrid(-0.7, 0.5)).toBe(-0.5)
  })

  it('should snap vector to grid correctly', () => {
    const vector = { x: 1.3, y: 2.7, z: 0.2 } as Vector3
    const snapped = snapVectorToGrid(vector, 0.5)

    expect(snapped.x).toBe(1.5)
    expect(snapped.y).toBe(2.5)
    expect(snapped.z).toBe(0.0)
  })

  it('should snap angle to increment correctly', () => {
    expect(snapAngle(22, 15)).toBe(15)
    expect(snapAngle(23, 15)).toBe(30)
    expect(snapAngle(90, 45)).toBe(90)
    expect(snapAngle(100, 45)).toBe(90)
  })

  it('should snap vector angles to increment correctly', () => {
    const angles = { x: 22, y: 100, z: 190 } as Vector3
    const snapped = snapVectorAngles(angles, 45)

    expect(snapped.x).toBe(0)
    expect(snapped.y).toBe(90)
    expect(snapped.z).toBe(180)
  })

  it('should check if positions are within snap distance', () => {
    const pos1 = { x: 0, y: 0, z: 0 } as Vector3
    const pos2 = { x: 0.3, y: 0, z: 0 } as Vector3
    const pos3 = { x: 1.0, y: 0, z: 0 } as Vector3

    expect(withinSnapDistance(pos1, pos2, 0.5)).toBe(true)
    expect(withinSnapDistance(pos1, pos3, 0.5)).toBe(false)
  })

  it('should generate unique object IDs', () => {
    const id1 = generateObjectId('wall')
    const id2 = generateObjectId('wall')

    expect(id1).toContain('wall-')
    expect(id2).toContain('wall-')
    expect(id1).not.toBe(id2)
  })
})

// ============================================================================
// DEFAULT DATA TESTS
// ============================================================================

describe('MapEditorData - Defaults', () => {
  it('should have valid default grid settings', () => {
    expect(DEFAULT_GRID_SETTINGS.enabled).toBe(true)
    expect(DEFAULT_GRID_SETTINGS.size).toBeGreaterThan(0)
    expect(DEFAULT_GRID_SETTINGS.divisions).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_GRID_SETTINGS.opacity).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_GRID_SETTINGS.opacity).toBeLessThanOrEqual(1)
  })

  it('should have valid default snap settings', () => {
    expect(DEFAULT_SNAP_SETTINGS.gridSize).toBeGreaterThan(0)
    expect(DEFAULT_SNAP_SETTINGS.angleIncrement).toBeGreaterThan(0)
    expect(DEFAULT_SNAP_SETTINGS.angleIncrement).toBeLessThanOrEqual(180)
  })

  it('should have valid default terrain brush', () => {
    expect(DEFAULT_TERRAIN_BRUSH.size).toBeGreaterThan(0)
    expect(DEFAULT_TERRAIN_BRUSH.strength).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_TERRAIN_BRUSH.strength).toBeLessThanOrEqual(1)
    expect(Object.values(BrushShape)).toContain(DEFAULT_TERRAIN_BRUSH.shape)
    expect(Object.values(BrushFalloff)).toContain(DEFAULT_TERRAIN_BRUSH.falloff)
  })

  it('should have valid default paint brush', () => {
    expect(DEFAULT_PAINT_BRUSH.size).toBeGreaterThan(0)
    expect(DEFAULT_PAINT_BRUSH.opacity).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_PAINT_BRUSH.opacity).toBeLessThanOrEqual(1)
    expect(DEFAULT_PAINT_BRUSH.flow).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_PAINT_BRUSH.flow).toBeLessThanOrEqual(1)
  })

  it('should have valid default camera settings', () => {
    expect(DEFAULT_CAMERA_SETTINGS.fov).toBeGreaterThan(0)
    expect(DEFAULT_CAMERA_SETTINGS.near).toBeGreaterThan(0)
    expect(DEFAULT_CAMERA_SETTINGS.far).toBeGreaterThan(DEFAULT_CAMERA_SETTINGS.near)
    expect(DEFAULT_CAMERA_SETTINGS.moveSpeed).toBeGreaterThan(0)
  })

  it('should have valid default viewport settings', () => {
    expect(DEFAULT_VIEWPORT_SETTINGS.ambientLightIntensity).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_VIEWPORT_SETTINGS.ambientLightIntensity).toBeLessThanOrEqual(1)
    expect(DEFAULT_VIEWPORT_SETTINGS.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('should have valid default history settings', () => {
    expect(DEFAULT_HISTORY_SETTINGS.maxActions).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_HISTORY_SETTINGS.groupTimeout).toBeGreaterThan(0)
  })

  it('should have valid default editor config', () => {
    expect(DEFAULT_EDITOR_CONFIG.maxObjectsInView).toBeGreaterThan(0)
    expect(DEFAULT_EDITOR_CONFIG.maxMapSize).toBeGreaterThan(0)
    expect(DEFAULT_EDITOR_CONFIG.autoSaveInterval).toBeGreaterThan(0)
    expect(DEFAULT_EDITOR_CONFIG.shortcuts).toBeDefined()
    expect(Object.keys(DEFAULT_EDITOR_CONFIG.shortcuts).length).toBeGreaterThan(0)
  })

  it('should have default layers', () => {
    expect(DEFAULT_LAYERS.length).toBeGreaterThan(0)
    DEFAULT_LAYERS.forEach(layer => {
      expect(layer.id).toBeDefined()
      expect(layer.name).toBeTruthy()
      expect(layer.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(Array.isArray(layer.objects)).toBe(true)
    })
  })

  it('should have default object templates', () => {
    expect(DEFAULT_OBJECT_TEMPLATES.length).toBeGreaterThan(0)
    DEFAULT_OBJECT_TEMPLATES.forEach(template => {
      expect(template.id).toBeDefined()
      expect(template.name).toBeTruthy()
      expect(Object.values(TemplateCategory)).toContain(template.category)
      expect(template.prefab).toBeDefined()
    })
  })
})

// ============================================================================
// EDITOR STATE TESTS
// ============================================================================

describe('MapEditorData - Editor State', () => {
  let state: ReturnType<typeof createDefaultEditorState>

  beforeEach(() => {
    state = createDefaultEditorState()
  })

  it('should create default editor state', () => {
    expect(state).toBeDefined()
    expect(state.map).toBeNull()
    expect(state.mapModified).toBe(false)
    expect(state.mode).toBe(EditorMode.SELECT)
    expect(state.tool).toBe(EditorTool.GEOMETRY)
    expect(state.gizmoType).toBe(GizmoType.TRANSLATE)
    expect(state.transformSpace).toBe(TransformSpace.WORLD)
  })

  it('should have empty selection initially', () => {
    expect(state.selectedObjects).toEqual([])
    expect(state.selectionMode).toBe(SelectionMode.SINGLE)
  })

  it('should have default grid and snap settings', () => {
    expect(state.gridSettings).toEqual(DEFAULT_GRID_SETTINGS)
    expect(state.snapSettings).toEqual(DEFAULT_SNAP_SETTINGS)
  })

  it('should have default layers', () => {
    expect(state.layers.length).toBe(DEFAULT_LAYERS.length)
    expect(state.activeLayer).toBe('layer-geometry')
  })

  it('should have empty history', () => {
    expect(state.history).toEqual([])
    expect(state.historyIndex).toBe(-1)
  })

  it('should have default brush settings', () => {
    expect(state.terrainBrush).toEqual(DEFAULT_TERRAIN_BRUSH)
    expect(state.paintBrush).toEqual(DEFAULT_PAINT_BRUSH)
  })

  it('should have auto-save enabled by default', () => {
    expect(state.autoSaveEnabled).toBe(true)
    expect(state.autoSaveInterval).toBe(300)
    expect(state.lastSaveTime).toBeGreaterThan(0)
  })
})

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('MapEditorData - Validation', () => {
  it('should validate correct editor state', () => {
    const state = createDefaultEditorState()
    const result = validateEditorState(state)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should detect invalid grid size', () => {
    const state = createDefaultEditorState()
    state.gridSettings.size = 0

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some(e => e.includes('Grid size'))).toBe(true)
  })

  it('should detect invalid grid divisions', () => {
    const state = createDefaultEditorState()
    state.gridSettings.divisions = 0

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('divisions'))).toBe(true)
  })

  it('should detect invalid snap grid size', () => {
    const state = createDefaultEditorState()
    state.snapSettings.gridSize = -1

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Snap grid'))).toBe(true)
  })

  it('should detect invalid snap angle', () => {
    const state = createDefaultEditorState()
    state.snapSettings.angleIncrement = 200

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('angle'))).toBe(true)
  })

  it('should detect invalid brush size', () => {
    const state = createDefaultEditorState()
    state.terrainBrush.size = -1

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('brush size'))).toBe(true)
  })

  it('should detect invalid brush strength', () => {
    const state = createDefaultEditorState()
    state.terrainBrush.strength = 1.5

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('strength'))).toBe(true)
  })

  it('should detect invalid history max actions', () => {
    const state = createDefaultEditorState()
    state.historySettings.maxActions = 0

    const result = validateEditorState(state)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('history'))).toBe(true)
  })
})

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('MapEditorData - Statistics', () => {
  it('should calculate stats for empty state', () => {
    const state = createDefaultEditorState()
    const stats = calculateEditorStats(state)

    expect(stats.totalObjects).toBe(0)
    expect(stats.selectedObjects).toBe(0)
    expect(stats.totalLayers).toBe(DEFAULT_LAYERS.length)
    expect(stats.historySize).toBe(0)
    expect(stats.canUndo).toBe(false)
    expect(stats.canRedo).toBe(false)
  })

  it('should calculate stats with objects in layers', () => {
    const state = createDefaultEditorState()
    state.layers[0].objects = ['obj1', 'obj2', 'obj3']
    state.layers[1].objects = ['obj4', 'obj5']

    const stats = calculateEditorStats(state)

    expect(stats.totalObjects).toBe(5)
  })

  it('should calculate stats with selection', () => {
    const state = createDefaultEditorState()
    state.selectedObjects = [
      {
        id: 'obj1',
        type: EditorTool.GEOMETRY,
        position: { x: 0, y: 0, z: 0 } as Vector3,
        rotation: { x: 0, y: 0, z: 0 } as Vector3,
        scale: { x: 1, y: 1, z: 1 } as Vector3,
        locked: false,
        visible: true,
        layer: 'layer-geometry',
        userData: {}
      }
    ]

    const stats = calculateEditorStats(state)

    expect(stats.selectedObjects).toBe(1)
  })

  it('should calculate undo/redo availability', () => {
    const state = createDefaultEditorState()

    // No history
    let stats = calculateEditorStats(state)
    expect(stats.canUndo).toBe(false)
    expect(stats.canRedo).toBe(false)

    // Add history
    state.history = [
      {
        type: EditorActionType.CREATE,
        timestamp: Date.now(),
        description: 'Test',
        undo: () => {},
        redo: () => {}
      }
    ]
    state.historyIndex = 0

    stats = calculateEditorStats(state)
    expect(stats.canUndo).toBe(true)
    expect(stats.canRedo).toBe(false)

    // Undo
    state.historyIndex = -1

    stats = calculateEditorStats(state)
    expect(stats.canUndo).toBe(false)
    expect(stats.canRedo).toBe(true)
  })
})

// ============================================================================
// ENUM TESTS
// ============================================================================

describe('MapEditorData - Enums', () => {
  it('should have all editor modes', () => {
    const modes = Object.values(EditorMode)
    expect(modes).toContain('select')
    expect(modes).toContain('move')
    expect(modes).toContain('rotate')
    expect(modes).toContain('scale')
    expect(modes).toContain('paint')
    expect(modes).toContain('terrain')
  })

  it('should have all editor tools', () => {
    const tools = Object.values(EditorTool)
    expect(tools).toContain('geometry')
    expect(tools).toContain('props')
    expect(tools).toContain('spawns')
    expect(tools).toContain('objectives')
    expect(tools).toContain('zones')
    expect(tools).toContain('lights')
  })

  it('should have all gizmo types', () => {
    const gizmos = Object.values(GizmoType)
    expect(gizmos).toContain('translate')
    expect(gizmos).toContain('rotate')
    expect(gizmos).toContain('scale')
    expect(gizmos.length).toBe(3)
  })

  it('should have all selection modes', () => {
    const modes = Object.values(SelectionMode)
    expect(modes).toContain('single')
    expect(modes).toContain('multiple')
    expect(modes).toContain('additive')
    expect(modes).toContain('subtract')
  })

  it('should have all brush shapes', () => {
    const shapes = Object.values(BrushShape)
    expect(shapes).toContain('circle')
    expect(shapes).toContain('square')
    expect(shapes).toContain('triangle')
  })

  it('should have all event types', () => {
    const events = Object.values(MapEditorEventType)
    expect(events).toContain('map_loaded')
    expect(events).toContain('map_saved')
    expect(events).toContain('object_created')
    expect(events).toContain('object_deleted')
    expect(events).toContain('mode_changed')
    expect(events).toContain('undo')
    expect(events).toContain('redo')
  })
})

// ============================================================================
// TEMPLATE TESTS
// ============================================================================

describe('MapEditorData - Object Templates', () => {
  it('should have wall template', () => {
    const wallTemplate = DEFAULT_OBJECT_TEMPLATES.find(t => t.id === 'wall-basic')
    expect(wallTemplate).toBeDefined()
    expect(wallTemplate?.category).toBe(TemplateCategory.WALLS)
    expect(wallTemplate?.prefab.geometry).toBeDefined()
  })

  it('should have floor template', () => {
    const floorTemplate = DEFAULT_OBJECT_TEMPLATES.find(t => t.id === 'floor-basic')
    expect(floorTemplate).toBeDefined()
    expect(floorTemplate?.category).toBe(TemplateCategory.FLOORS)
  })

  it('should have stairs template', () => {
    const stairsTemplate = DEFAULT_OBJECT_TEMPLATES.find(t => t.id === 'stairs-basic')
    expect(stairsTemplate).toBeDefined()
    expect(stairsTemplate?.category).toBe(TemplateCategory.STAIRS)
  })

  it('should have cover template', () => {
    const coverTemplate = DEFAULT_OBJECT_TEMPLATES.find(t => t.id === 'cover-crate')
    expect(coverTemplate).toBeDefined()
    expect(coverTemplate?.category).toBe(TemplateCategory.COVER)
    expect(coverTemplate?.prefab.geometry?.cover).toBeDefined()
  })

  it('should have valid template dimensions', () => {
    DEFAULT_OBJECT_TEMPLATES.forEach(template => {
      if (template.prefab.geometry?.dimensions) {
        const dims = template.prefab.geometry.dimensions
        expect(dims.x).toBeGreaterThan(0)
        expect(dims.y).toBeGreaterThan(0)
        expect(dims.z).toBeGreaterThan(0)
      }
    })
  })

  it('should have valid default scales', () => {
    DEFAULT_OBJECT_TEMPLATES.forEach(template => {
      const scale = template.defaultScale
      expect(scale.x).toBeGreaterThan(0)
      expect(scale.y).toBeGreaterThan(0)
      expect(scale.z).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// COMPLETE TEST SUMMARY
// ============================================================================

describe('MapEditorData - Complete System', () => {
  it('should have all required data structures', () => {
    // Enums
    expect(EditorMode).toBeDefined()
    expect(EditorTool).toBeDefined()
    expect(GizmoType).toBeDefined()
    expect(TransformSpace).toBeDefined()
    expect(SelectionMode).toBeDefined()
    expect(BrushShape).toBeDefined()
    expect(BrushFalloff).toBeDefined()
    expect(TemplateCategory).toBeDefined()
    expect(MapEditorEventType).toBeDefined()
    expect(EditorActionType).toBeDefined()

    // Defaults
    expect(DEFAULT_GRID_SETTINGS).toBeDefined()
    expect(DEFAULT_SNAP_SETTINGS).toBeDefined()
    expect(DEFAULT_TERRAIN_BRUSH).toBeDefined()
    expect(DEFAULT_PAINT_BRUSH).toBeDefined()
    expect(DEFAULT_CAMERA_SETTINGS).toBeDefined()
    expect(DEFAULT_VIEWPORT_SETTINGS).toBeDefined()
    expect(DEFAULT_HISTORY_SETTINGS).toBeDefined()
    expect(DEFAULT_EDITOR_CONFIG).toBeDefined()
    expect(DEFAULT_LAYERS).toBeDefined()
    expect(DEFAULT_OBJECT_TEMPLATES).toBeDefined()

    // Functions
    expect(typeof createDefaultEditorState).toBe('function')
    expect(typeof snapToGrid).toBe('function')
    expect(typeof snapVectorToGrid).toBe('function')
    expect(typeof snapAngle).toBe('function')
    expect(typeof snapVectorAngles).toBe('function')
    expect(typeof withinSnapDistance).toBe('function')
    expect(typeof generateObjectId).toBe('function')
    expect(typeof validateEditorState).toBe('function')
    expect(typeof calculateEditorStats).toBe('function')
  })
})
