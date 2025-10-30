'use client'

/**
 * MapEditorUI.tsx
 *
 * PROFESSIONAL MAP EDITOR UI COMPONENT
 *
 * React-based UI for the FPS Map Editor with full controls:
 * - Top Toolbar (Tools, Modes, Gizmos)
 * - Left Sidebar (Object Templates, Asset Browser)
 * - Right Sidebar (Properties, Layers)
 * - Bottom Panel (Console, Stats)
 * - 3D Viewport
 *
 * @module MapEditorUI
 * @category Editor
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapEditor } from './MapEditor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Grid3x3,
  Move,
  RotateCw,
  Maximize2,
  Box,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Settings,
  Play,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type {
  EditorMode,
  EditorTool,
  GizmoType,
  MapEditorEventType
} from './data/MapEditorData'

interface MapEditorUIProps {
  onClose?: () => void
}

export function MapEditorUI({ onClose }: MapEditorUIProps) {
  // Refs
  const viewportRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MapEditor | null>(null)

  // UI State
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [showBottomPanel, setShowBottomPanel] = useState(false)

  // Editor State
  const [currentMode, setCurrentMode] = useState<string>('select')
  const [currentTool, setCurrentTool] = useState<string>('geometry')
  const [currentGizmo, setCurrentGizmo] = useState<string>('translate')
  const [selectedCount, setSelectedCount] = useState(0)
  const [mapName, setMapName] = useState('Untitled Map')
  const [isModified, setIsModified] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalObjects: 0,
    selectedObjects: 0,
    totalLayers: 4,
    historySize: 0
  })

  // Initialize editor
  useEffect(() => {
    if (!viewportRef.current || editorRef.current) return

    const editor = new MapEditor(viewportRef.current)
    editorRef.current = editor

    // Subscribe to events
    editor.on('mode_changed' as MapEditorEventType, (event) => {
      setCurrentMode(event.data?.mode as string || 'select')
    })

    editor.on('tool_changed' as MapEditorEventType, (event) => {
      setCurrentTool(event.data?.tool as string || 'geometry')
    })

    editor.on('gizmo_changed' as MapEditorEventType, (event) => {
      setCurrentGizmo(event.data?.gizmoType as string || 'translate')
    })

    editor.on('object_selected' as MapEditorEventType, () => {
      updateStats()
    })

    editor.on('object_deselected' as MapEditorEventType, () => {
      updateStats()
    })

    editor.on('map_modified' as MapEditorEventType, () => {
      setIsModified(true)
    })

    editor.on('map_saved' as MapEditorEventType, () => {
      setIsModified(false)
    })

    // Create a new map by default
    editor.createNewMap('Untitled Map', 'urban', 'medium')

    return () => {
      editor.dispose()
    }
  }, [])

  // Update stats from editor
  const updateStats = useCallback(() => {
    if (!editorRef.current) return
    const editorStats = editorRef.current.getStats()
    setStats(editorStats)
    setSelectedCount(editorStats.selectedObjects)
    setCanUndo(editorStats.canUndo)
    setCanRedo(editorStats.canRedo)
  }, [])

  // Toolbar actions
  const handleNewMap = () => {
    if (editorRef.current) {
      editorRef.current.createNewMap('New Map', 'urban', 'medium')
      setMapName('New Map')
    }
  }

  const handleSave = () => {
    editorRef.current?.saveMap()
  }

  const handleExport = () => {
    if (!editorRef.current) return
    const json = editorRef.current.exportMap()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mapName}.json`
    a.click()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editorRef.current) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const json = event.target?.result as string
        editorRef.current?.importMap(json)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleUndo = () => {
    editorRef.current?.undo()
    updateStats()
  }

  const handleRedo = () => {
    editorRef.current?.redo()
    updateStats()
  }

  const handleDelete = () => {
    editorRef.current?.deleteSelection()
    updateStats()
  }

  const handleDuplicate = () => {
    editorRef.current?.duplicateSelection()
    updateStats()
  }

  const handleSelectAll = () => {
    editorRef.current?.selectAll()
    updateStats()
  }

  const handleToggleGrid = () => {
    editorRef.current?.toggleGrid()
  }

  const handleFocus = () => {
    editorRef.current?.focusSelected()
  }

  const handlePlayTest = () => {
    alert('Play Test feature coming soon!')
  }

  // Gizmo/Mode changes
  const handleModeChange = (mode: string) => {
    editorRef.current?.setMode(mode as EditorMode)
  }

  const handleToolChange = (tool: string) => {
    editorRef.current?.setTool(tool as EditorTool)
  }

  const handleGizmoChange = (gizmo: string) => {
    editorRef.current?.setGizmoType(gizmo as GizmoType)
  }

  // Object template placement
  const handlePlaceObject = (templateId: string) => {
    editorRef.current?.createObjectFromTemplate(templateId)
    updateStats()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* File Operations */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewMap}
            title="New Map"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alert('Load coming soon!')}
            title="Open Map"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            title="Save Map (Ctrl+S)"
            className={isModified ? 'text-yellow-400' : ''}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Import/Export */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImport}
            title="Import JSON"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* History */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Transform Gizmos */}
        <div className="flex items-center gap-1">
          <Button
            variant={currentGizmo === 'translate' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleGizmoChange('translate')}
            title="Move (W)"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button
            variant={currentGizmo === 'rotate' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleGizmoChange('rotate')}
            title="Rotate (E)"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button
            variant={currentGizmo === 'scale' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleGizmoChange('scale')}
            title="Scale (R)"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Selection Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            title="Select All (Ctrl+A)"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={selectedCount === 0}
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={selectedCount === 0}
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* View Options */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleGrid}
            title="Toggle Grid (G)"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFocus}
            disabled={selectedCount === 0}
            title="Focus Selected (F)"
          >
            Focus
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Play Test */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayTest}
            title="Play Test Map"
            className="text-green-400"
          >
            <Play className="w-4 h-4 mr-1" />
            Play Test
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Map Info */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono">
            {stats.totalObjects} Objects
          </Badge>
          {selectedCount > 0 && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
              {selectedCount} Selected
            </Badge>
          )}
          {isModified && (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300">
              ● Modified
            </Badge>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close Editor"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Object Browser */}
        {showLeftSidebar && (
          <Card className="w-64 bg-gray-800 border-gray-700 rounded-none flex flex-col">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Objects</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeftSidebar(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Tool Selection */}
              <div>
                <Label className="text-xs text-gray-400">Tool</Label>
                <Select value={currentTool} onValueChange={handleToolChange}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geometry">Geometry</SelectItem>
                    <SelectItem value="props">Props</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="spawns">Spawns</SelectItem>
                    <SelectItem value="objectives">Objectives</SelectItem>
                    <SelectItem value="zones">Zones</SelectItem>
                    <SelectItem value="lights">Lights</SelectItem>
                    <SelectItem value="sounds">Sounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Object Templates */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlaceObject('wall-basic')}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Box className="w-6 h-6 mb-1" />
                    <span className="text-xs">Wall</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlaceObject('floor-basic')}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Box className="w-6 h-6 mb-1" />
                    <span className="text-xs">Floor</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlaceObject('stairs-basic')}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Box className="w-6 h-6 mb-1" />
                    <span className="text-xs">Stairs</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlaceObject('cover-crate')}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Box className="w-6 h-6 mb-1" />
                    <span className="text-xs">Crate</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Collapse/Expand Left Sidebar */}
        {!showLeftSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeftSidebar(true)}
            className="w-8 h-full rounded-none bg-gray-800 border-r border-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* 3D Viewport */}
        <div className="flex-1 relative bg-black">
          <div ref={viewportRef} className="w-full h-full" />

          {/* Viewport Overlay - Help Text */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur p-3 rounded text-xs space-y-1">
            <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
            <div><span className="text-gray-400">W/E/R:</span> Move/Rotate/Scale</div>
            <div><span className="text-gray-400">Ctrl+S:</span> Save</div>
            <div><span className="text-gray-400">Ctrl+Z/Y:</span> Undo/Redo</div>
            <div><span className="text-gray-400">Del:</span> Delete</div>
            <div><span className="text-gray-400">Ctrl+D:</span> Duplicate</div>
            <div><span className="text-gray-400">F:</span> Focus Selected</div>
            <div><span className="text-gray-400">G:</span> Toggle Grid</div>
          </div>

          {/* Viewport Overlay - Stats */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur p-2 rounded text-xs">
            <div className="font-mono">
              Objects: {stats.totalObjects} | Selected: {stats.selectedObjects}
            </div>
          </div>
        </div>

        {/* Collapse/Expand Right Sidebar */}
        {!showRightSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRightSidebar(true)}
            className="w-8 h-full rounded-none bg-gray-800 border-l border-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Right Sidebar - Properties & Layers */}
        {showRightSidebar && (
          <Card className="w-64 bg-gray-800 border-gray-700 rounded-none flex flex-col">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRightSidebar(false)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Map Properties */}
              <div>
                <Label className="text-xs text-gray-400">Map Name</Label>
                <Input
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  className="mt-1"
                  placeholder="Map Name"
                />
              </div>

              {/* Object Properties */}
              {selectedCount > 0 && (
                <div>
                  <Label className="text-xs text-gray-400">Selected Object</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Count:</span>
                      <span>{selectedCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Layers */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Layers</Label>
                <div className="space-y-1">
                  {['Geometry', 'Props', 'Gameplay', 'Lighting'].map((layer) => (
                    <div
                      key={layer}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <span className="flex-1 text-sm">{layer}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Unlock className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Settings */}
              <div>
                <Label className="text-xs text-gray-400">Grid Settings</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue="0.5"
                      step="0.1"
                      className="flex-1"
                      placeholder="Grid Size"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Panel - Console */}
      {showBottomPanel && (
        <Card className="h-32 bg-gray-800 border-gray-700 border-t rounded-none">
          <div className="p-2 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Console</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBottomPanel(false)}
            >
              ✕
            </Button>
          </div>
          <div className="p-2 h-20 overflow-y-auto font-mono text-xs text-gray-400">
            <div>Map Editor initialized</div>
            <div>Ready to edit</div>
          </div>
        </Card>
      )}
    </div>
  )
}
