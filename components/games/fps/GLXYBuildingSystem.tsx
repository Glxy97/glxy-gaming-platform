// @ts-nocheck
/**
 * GLXY Building/Destruction System - Phase 2 Implementation
 * Placeable Structures, Destruction Physics, Resource Management, and Materials
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  Home,
  Hammer,
  Shield,
  Package,
  Zap,
  Droplets,
  Trees,
  Square,
  Edit,
  Trash2,
  Copy,
  Maximize2,
  Move3D,
  Grid3X3,
  Layers,
  Settings,
  Wrench,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Building Materials System
export interface BuildingMaterial {
  id: string
  name: string
  type: 'wood' | 'stone' | 'metal' | 'concrete' | 'glass' | 'composite'
  durability: number
  strength: number
  weight: number
  cost: {
    wood: number
    stone: number
    metal: number
    energy: number
  }
  color: string
  texture: string
  normalMap?: string
  roughnessMap?: string
  metallicMap?: string
  soundProfile: {
    impact: string
    break: string
    build: string
  }
  particleEffects: {
    impact: string
    break: string
  }
  resistance: {
    bullet: number
    explosion: number
    fire: number
    melee: number
  }
  isUnlocked: boolean
  unlockLevel: number
}

// Structure Types
export interface StructureType {
  id: string
  name: string
  category: 'wall' | 'floor' | 'ramp' | 'stair' | 'door' | 'window' | 'roof' | 'tower' | 'bridge'
  dimensions: {
    width: number
    height: number
    depth: number
  }
  materialRequirement: number
  buildTime: number
  health: number
  maxHealth: number
  description: string
  icon: string
  isUnlocked: boolean
  unlockLevel: number
  cost: number
  editModes: ('resize' | 'rotate' | 'move' | 'delete' | 'change_material' | 'add_doors' | 'add_windows')[]
}

// Edit Modes for Structures
export interface EditMode {
  id: string
  name: string
  icon: string
  description: string
  allowedModifications: ('resize' | 'rotate' | 'move' | 'delete' | 'change_material' | 'add_doors' | 'add_windows')[]
}

// Placed Structure Instance
export interface PlacedStructure {
  id: string
  type: StructureType
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  material: BuildingMaterial
  currentHealth: number
  maxHealth: number
  isDamaged: boolean
  damageState: 'intact' | 'cracked' | 'broken' | 'destroyed'
  buildProgress: number
  isCompleted: boolean
  lastModified: number
  ownerId: string
  teamId?: string
  customModifications: StructureModification[]
  attachments: StructureAttachment[]
}

// Structure Modifications
export interface StructureModification {
  id: string
  type: 'door' | 'window' | 'destruction' | 'reinforcement'
  position: THREE.Vector3
  dimensions: THREE.Vector3
  material?: BuildingMaterial
  health?: number
}

// Structure Attachments
export interface StructureAttachment {
  id: string
  type: 'ladder' | 'trap' | 'turret' | 'light' | 'speaker' | 'camera'
  position: THREE.Vector3
  isActive: boolean
  energy?: number
  ammo?: number
}

// Resource Management
export interface PlayerResources {
  wood: number
  stone: number
  metal: number
  energy: number
  maxCapacity: number
  gatheringRate: number
  lastGather: number
}

// Building Templates/Blueprints
export interface BuildingBlueprint {
  id: string
  name: string
  description: string
  category: 'defensive' | 'offensive' | 'utility' | 'aesthetic'
  structures: PlacedStructure[]
  totalCost: {
    wood: number
    stone: number
    metal: number
    energy: number
  }
  buildTime: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  isFavorite: boolean
  isPublic: boolean
  creator: string
  downloads: number
  rating: number
}

// Destruction Physics
export interface DestructionData {
  structureId: string
  damageType: 'bullet' | 'explosion' | 'melee' | 'fire' | 'environment'
  damageAmount: number
  impactPoint: THREE.Vector3
  impactForce: THREE.Vector3
  damageRadius: number
  debrisParticles: DebrisParticle[]
  structuralDamage: StructuralDamage[]
}

export interface DebrisParticle {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  size: number
  material: BuildingMaterial
  lifetime: number
  mesh?: THREE.Mesh
}

export interface StructuralDamage {
  type: 'crack' | 'hole' | 'break' | 'deformation'
  position: THREE.Vector3
  size: number
  depth: number
  severity: number
}

export class GLXYBuildingSystem {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  // Building State
  private isBuildingMode = false
  private selectedStructureType: StructureType | null = null
  private selectedMaterial: BuildingMaterial | null = null
  private previewStructure: THREE.Group | null = null
  private placedStructures: Map<string, PlacedStructure> = new Map()
  private structureMeshes: Map<string, THREE.Group> = new Map()

  // Resources
  private playerResources: PlayerResources = {
    wood: 100,
    stone: 50,
    metal: 25,
    energy: 10,
    maxCapacity: 999,
    gatheringRate: 1,
    lastGather: Date.now()
  }

  // Physics
  private debrisParticles: DebrisParticle[] = []
  private destructionQueue: DestructionData[] = []
  private physicsWorld: any = null // Would integrate with physics engine

  // Materials and Structure Types
  private buildingMaterials: Map<string, BuildingMaterial> = new Map()
  private structureTypes: Map<string, StructureType> = new Map()
  private blueprints: Map<string, BuildingBlueprint> = new Map()

  // Edit Mode
  private isEditMode = false
  private editingStructure: PlacedStructure | null = null
  private selectedEditMode: EditMode | null = null

  // Building Validation
  private buildingRules: BuildingRule[] = []
  private invalidPositions: THREE.Vector3[] = []

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    this.initializeMaterials()
    this.initializeStructureTypes()
    this.initializeBuildingRules()
    this.setupEventListeners()
  }

  private initializeMaterials(): void {
    const materials: BuildingMaterial[] = [
      {
        id: 'wood_basic',
        name: 'Basic Wood',
        type: 'wood',
        durability: 100,
        strength: 50,
        weight: 1,
        cost: { wood: 10, stone: 0, metal: 0, energy: 1 },
        color: '#8B4513',
        texture: '/textures/building/wood_basic.jpg',
        soundProfile: {
          impact: 'wood_impact',
          break: 'wood_break',
          build: 'wood_build'
        },
        particleEffects: {
          impact: 'wood_splinter',
          break: 'wood_debris'
        },
        resistance: {
          bullet: 0.3,
          explosion: 0.2,
          fire: 0.1,
          melee: 0.4
        },
        isUnlocked: true,
        unlockLevel: 1
      },
      {
        id: 'stone_basic',
        name: 'Basic Stone',
        type: 'stone',
        durability: 200,
        strength: 80,
        weight: 2,
        cost: { wood: 0, stone: 15, metal: 0, energy: 2 },
        color: '#808080',
        texture: '/textures/building/stone_basic.jpg',
        soundProfile: {
          impact: 'stone_impact',
          break: 'stone_break',
          build: 'stone_build'
        },
        particleEffects: {
          impact: 'stone_chip',
          break: 'stone_debris'
        },
        resistance: {
          bullet: 0.6,
          explosion: 0.5,
          fire: 0.8,
          melee: 0.7
        },
        isUnlocked: true,
        unlockLevel: 1
      },
      {
        id: 'metal_basic',
        name: 'Basic Metal',
        type: 'metal',
        durability: 300,
        strength: 150,
        weight: 3,
        cost: { wood: 0, stone: 0, metal: 20, energy: 3 },
        color: '#C0C0C0',
        texture: '/textures/building/metal_basic.jpg',
        normalMap: '/textures/building/metal_basic_normal.jpg',
        roughnessMap: '/textures/building/metal_basic_roughness.jpg',
        metallicMap: '/textures/building/metal_basic_metallic.jpg',
        soundProfile: {
          impact: 'metal_impact',
          break: 'metal_break',
          build: 'metal_build'
        },
        particleEffects: {
          impact: 'metal_spark',
          break: 'metal_debris'
        },
        resistance: {
          bullet: 0.8,
          explosion: 0.7,
          fire: 0.9,
          melee: 0.9
        },
        isUnlocked: false,
        unlockLevel: 5
      },
      {
        id: 'concrete_reinforced',
        name: 'Reinforced Concrete',
        type: 'concrete',
        durability: 500,
        strength: 200,
        weight: 4,
        cost: { wood: 0, stone: 30, metal: 15, energy: 5 },
        color: '#696969',
        texture: '/textures/building/concrete_reinforced.jpg',
        soundProfile: {
          impact: 'concrete_impact',
          break: 'concrete_break',
          build: 'concrete_build'
        },
        particleEffects: {
          impact: 'concrete_dust',
          break: 'concrete_debris'
        },
        resistance: {
          bullet: 0.9,
          explosion: 0.8,
          fire: 1.0,
          melee: 0.95
        },
        isUnlocked: false,
        unlockLevel: 10
      },
      {
        id: 'glass_ballistic',
        name: 'Ballistic Glass',
        type: 'glass',
        durability: 150,
        strength: 100,
        weight: 1.5,
        cost: { wood: 0, stone: 0, metal: 25, energy: 10 },
        color: 'rgba(135, 206, 235, 0.3)',
        texture: '/textures/building/glass_ballistic.jpg',
        soundProfile: {
          impact: 'glass_impact',
          break: 'glass_break',
          build: 'glass_build'
        },
        particleEffects: {
          impact: 'glass_chip',
          break: 'glass_shatter'
        },
        resistance: {
          bullet: 0.7,
          explosion: 0.3,
          fire: 1.0,
          melee: 0.2
        },
        isUnlocked: false,
        unlockLevel: 15
      }
    ]

    materials.forEach(material => {
      this.buildingMaterials.set(material.id, material)
    })
  }

  private initializeStructureTypes(): void {
    const structures: StructureType[] = [
      {
        id: 'wall_basic',
        name: 'Wall',
        category: 'wall',
        dimensions: { width: 4, height: 3, depth: 0.3 },
        materialRequirement: 10,
        buildTime: 3000,
        health: 200,
        maxHealth: 200,
        description: 'Basic defensive wall',
        icon: '🧱',
        isUnlocked: true,
        unlockLevel: 1,
        cost: 50,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material', 'add_doors', 'add_windows']
      },
      {
        id: 'floor_basic',
        name: 'Floor',
        category: 'floor',
        dimensions: { width: 4, height: 0.2, depth: 4 },
        materialRequirement: 8,
        buildTime: 2000,
        health: 100,
        maxHealth: 100,
        description: 'Basic floor tile',
        icon: '📦',
        isUnlocked: true,
        unlockLevel: 1,
        cost: 30,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material']
      },
      {
        id: 'ramp_basic',
        name: 'Ramp',
        category: 'ramp',
        dimensions: { width: 4, height: 3, depth: 4 },
        materialRequirement: 12,
        buildTime: 4000,
        health: 150,
        maxHealth: 150,
        description: 'Ramp for elevated access',
        icon: '📈',
        isUnlocked: true,
        unlockLevel: 2,
        cost: 60,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material']
      },
      {
        id: 'stair_basic',
        name: 'Stairs',
        category: 'stair',
        dimensions: { width: 3, height: 3, depth: 4 },
        materialRequirement: 15,
        buildTime: 5000,
        health: 180,
        maxHealth: 180,
        description: 'Staircase for vertical movement',
        icon: '🪜',
        isUnlocked: true,
        unlockLevel: 3,
        cost: 75,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material']
      },
      {
        id: 'door_basic',
        name: 'Door',
        category: 'door',
        dimensions: { width: 1, height: 2, depth: 0.3 },
        materialRequirement: 8,
        buildTime: 2500,
        health: 120,
        maxHealth: 120,
        description: 'Basic door for access',
        icon: '🚪',
        isUnlocked: true,
        unlockLevel: 2,
        cost: 40,
        editModes: ['move', 'delete', 'change_material']
      },
      {
        id: 'window_basic',
        name: 'Window',
        category: 'window',
        dimensions: { width: 1.5, height: 1.5, depth: 0.3 },
        materialRequirement: 6,
        buildTime: 2000,
        health: 80,
        maxHealth: 80,
        description: 'Basic window for visibility',
        icon: '🪟',
        isUnlocked: true,
        unlockLevel: 2,
        cost: 35,
        editModes: ['move', 'delete', 'change_material']
      },
      {
        id: 'tower_basic',
        name: 'Watch Tower',
        category: 'tower',
        dimensions: { width: 4, height: 8, depth: 4 },
        materialRequirement: 40,
        buildTime: 15000,
        health: 500,
        maxHealth: 500,
        description: 'Tall tower for observation',
        icon: '🏰',
        isUnlocked: false,
        unlockLevel: 8,
        cost: 300,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material', 'add_doors', 'add_windows']
      },
      {
        id: 'bridge_basic',
        name: 'Bridge',
        category: 'bridge',
        dimensions: { width: 8, height: 2, depth: 4 },
        materialRequirement: 35,
        buildTime: 12000,
        health: 400,
        maxHealth: 400,
        description: 'Bridge to cross gaps',
        icon: '🌉',
        isUnlocked: false,
        unlockLevel: 6,
        cost: 250,
        editModes: ['resize', 'rotate', 'move', 'delete', 'change_material']
      }
    ]

    structures.forEach(structure => {
      this.structureTypes.set(structure.id, structure)
    })
  }

  private initializeBuildingRules(): void {
    this.buildingRules = [
      {
        type: 'height_limit',
        description: 'Maximum building height: 50m',
        validator: (position: THREE.Vector3, structure: StructureType) => {
          return position.y + structure.dimensions.height <= 50
        }
      },
      {
        type: 'ground_collision',
        description: 'Structures must be supported by ground or other structures',
        validator: (position: THREE.Vector3, structure: StructureType) => {
          return position.y >= 0 || this.hasSupportingStructure(position, structure)
        }
      },
      {
        type: 'spacing',
        description: 'Minimum spacing between structures: 0.5m',
        validator: (position: THREE.Vector3, structure: StructureType) => {
          return !this.checkStructureCollision(position, structure)
        }
      },
      {
        type: 'resource_cost',
        description: 'Insufficient resources',
        validator: (position: THREE.Vector3, structure: StructureType) => {
          return this.canAffordStructure(structure)
        }
      }
    ]
  }

  // Building Mode Controls
  public enterBuildingMode(): void {
    this.isBuildingMode = true
    this.createPreviewStructure()
  }

  public exitBuildingMode(): void {
    this.isBuildingMode = false
    this.removePreviewStructure()
    this.selectedStructureType = null
    this.selectedMaterial = null
  }

  public selectStructureType(structureId: string): boolean {
    const structure = this.structureTypes.get(structureId)
    if (!structure || !structure.isUnlocked) return false

    this.selectedStructureType = structure
    this.updatePreviewStructure()
    return true
  }

  public selectMaterial(materialId: string): boolean {
    const material = this.buildingMaterials.get(materialId)
    if (!material || !material.isUnlocked) return false

    this.selectedMaterial = material
    this.updatePreviewStructure()
    return true
  }

  // Structure Placement
  public placeStructure(worldPosition: THREE.Vector3): boolean {
    if (!this.isBuildingMode || !this.selectedStructureType || !this.selectedMaterial) {
      return false
    }

    // Validate placement
    if (!this.validateStructurePlacement(worldPosition, this.selectedStructureType)) {
      return false
    }

    // Check resources
    if (!this.canAffordStructure(this.selectedStructureType)) {
      toast.error('Insufficient resources!')
      return false
    }

    // Create structure
    const structureId = `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const structure: PlacedStructure = {
      id: structureId,
      type: this.selectedStructureType,
      position: worldPosition.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      material: this.selectedMaterial,
      currentHealth: this.selectedStructureType.maxHealth,
      maxHealth: this.selectedStructureType.maxHealth,
      isDamaged: false,
      damageState: 'intact',
      buildProgress: 0,
      isCompleted: false,
      lastModified: Date.now(),
      ownerId: 'player',
      customModifications: [],
      attachments: []
    }

    // Deduct resources
    this.deductResources(this.selectedStructureType)

    // Add to structures
    this.placedStructures.set(structureId, structure)

    // Create mesh
    const structureMesh = this.createStructureMesh(structure)
    this.structureMeshes.set(structureId, structureMesh)
    this.scene.add(structureMesh)

    // Start building animation
    this.startBuildingAnimation(structure)

    toast.success(`${this.selectedStructureType.name} placed!`)

    return true
  }

  private validateStructurePlacement(position: THREE.Vector3, structure: StructureType): boolean {
    for (const rule of this.buildingRules) {
      if (!rule.validator(position, structure)) {
        toast.error(rule.description)
        return false
      }
    }
    return true
  }

  private canAffordStructure(structure: StructureType): boolean {
    const materialCost = this.calculateMaterialCost(structure)
    return (
      this.playerResources.wood >= materialCost.wood &&
      this.playerResources.stone >= materialCost.stone &&
      this.playerResources.metal >= materialCost.metal &&
      this.playerResources.energy >= materialCost.energy
    )
  }

  private calculateMaterialCost(structure: StructureType): { wood: number; stone: number; metal: number; energy: number } {
    if (!this.selectedMaterial) return { wood: 0, stone: 0, metal: 0, energy: 0 }

    const baseCost = this.selectedMaterial.cost
    const multiplier = structure.materialRequirement / 10

    return {
      wood: baseCost.wood * multiplier,
      stone: baseCost.stone * multiplier,
      metal: baseCost.metal * multiplier,
      energy: baseCost.energy * multiplier
    }
  }

  private deductResources(structure: StructureType): void {
    const cost = this.calculateMaterialCost(structure)
    this.playerResources.wood -= cost.wood
    this.playerResources.stone -= cost.stone
    this.playerResources.metal -= cost.metal
    this.playerResources.energy -= cost.energy
  }

  // Structure Mesh Creation
  private createStructureMesh(structure: PlacedStructure): THREE.Group {
    const group = new THREE.Group()

    // Create geometry based on structure type
    let geometry: THREE.BufferGeometry
    const material = this.createThreeMaterial(structure.material)

    switch (structure.type.category) {
      case 'wall':
        geometry = new THREE.BoxGeometry(
          structure.type.dimensions.width,
          structure.type.dimensions.height,
          structure.type.dimensions.depth
        )
        break

      case 'floor':
        geometry = new THREE.BoxGeometry(
          structure.type.dimensions.width,
          structure.type.dimensions.height,
          structure.type.dimensions.depth
        )
        break

      case 'ramp':
        // Create ramp geometry (triangular prism)
        const rampShape = new THREE.Shape()
        rampShape.moveTo(0, 0)
        rampShape.lineTo(structure.type.dimensions.width, 0)
        rampShape.lineTo(structure.type.dimensions.width, structure.type.dimensions.height)
        rampShape.lineTo(0, 0)

        const extrudeSettings = {
          depth: structure.type.dimensions.depth,
          bevelEnabled: false
        }
        geometry = new THREE.ExtrudeGeometry(rampShape, extrudeSettings)
        break

      case 'stair':
        // Create stairs geometry
        const stairGroup = new THREE.Group()
        const stepHeight = structure.type.dimensions.height / 6
        const stepDepth = structure.type.dimensions.depth / 6

        for (let i = 0; i < 6; i++) {
          const stepGeometry = new THREE.BoxGeometry(
            structure.type.dimensions.width,
            stepHeight,
            stepDepth
          )
          const stepMesh = new THREE.Mesh(stepGeometry, material)
          stepMesh.position.set(0, i * stepHeight, i * stepDepth)
          stairGroup.add(stepMesh)
        }
        return stairGroup

      default:
        geometry = new THREE.BoxGeometry(
          structure.type.dimensions.width,
          structure.type.dimensions.height,
          structure.type.dimensions.depth
        )
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(structure.position)
    mesh.rotation.copy(structure.rotation)
    mesh.scale.copy(structure.scale)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.structureId = structure.id

    group.add(mesh)
    return group
  }

  private createThreeMaterial(material: BuildingMaterial): THREE.Material {
    // Load textures (in a real implementation, you'd load these from files)
    const textureLoader = new THREE.TextureLoader()

    let materialConfig: THREE.MeshStandardMaterialParameters = {
      color: material.color,
      roughness: 0.8,
      metalness: material.type === 'metal' ? 0.9 : 0.1
    }

    // For glass materials
    if (material.type === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        color: material.color,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0
      })
    }

    return new THREE.MeshStandardMaterial(materialConfig)
  }

  // Building Animation
  private startBuildingAnimation(structure: PlacedStructure): void {
    const startTime = Date.now()
    const buildDuration = structure.type.buildTime

    const animateBuild = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / buildDuration, 1)

      structure.buildProgress = progress
      structure.isCompleted = progress >= 1

      // Update visual representation
      const mesh = this.structureMeshes.get(structure.id)
      if (mesh) {
        mesh.scale.setScalar(progress)
        // Set opacity on all child materials
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if ('opacity' in mat) {
                  (mat as any).opacity = progress
                }
              })
            } else if ('opacity' in child.material) {
              (child.material as any).opacity = progress
            }
          }
        })
      }

      if (progress < 1) {
        requestAnimationFrame(animateBuild)
      } else {
        toast.success(`${structure.type.name} completed!`)
      }
    }

    animateBuild()
  }

  // Preview Structure
  private createPreviewStructure(): void {
    if (!this.selectedStructureType || !this.selectedMaterial) return

    const previewGroup = new THREE.Group()
    const geometry = new THREE.BoxGeometry(
      this.selectedStructureType.dimensions.width,
      this.selectedStructureType.dimensions.height,
      this.selectedStructureType.dimensions.depth
    )

    const material = new THREE.MeshBasicMaterial({
      color: this.selectedMaterial.color,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    })

    const previewMesh = new THREE.Mesh(geometry, material)
    previewGroup.add(previewMesh)

    this.previewStructure = previewGroup
    this.scene.add(previewGroup)
  }

  private updatePreviewStructure(): void {
    if (!this.previewStructure) return

    // Remove old preview
    this.scene.remove(this.previewStructure)

    // Create new preview with updated settings
    this.createPreviewStructure()
  }

  private removePreviewStructure(): void {
    if (this.previewStructure) {
      this.scene.remove(this.previewStructure)
      this.previewStructure = null
    }
  }

  // Edit Mode
  public enterEditMode(structureId: string): boolean {
    const structure = this.placedStructures.get(structureId)
    if (!structure || !structure.isCompleted) return false

    this.isEditMode = true
    this.editingStructure = structure
    return true
  }

  public exitEditMode(): void {
    this.isEditMode = false
    this.editingStructure = null
    this.selectedEditMode = null
  }

  public editStructure(modification: StructureModification): boolean {
    if (!this.editingStructure) return false

    this.editingStructure.customModifications.push(modification)
    this.updateStructureMesh(this.editingStructure)
    return true
  }

  private updateStructureMesh(structure: PlacedStructure): void {
    const mesh = this.structureMeshes.get(structure.id)
    if (!mesh) return

    // Remove old mesh
    this.scene.remove(mesh)

    // Create updated mesh
    const newMesh = this.createStructureMesh(structure)
    this.structureMeshes.set(structure.id, newMesh)
    this.scene.add(newMesh)
  }

  // Destruction System
  public applyDamage(structureId: string, damage: DestructionData): boolean {
    const structure = this.placedStructures.get(structureId)
    if (!structure) return false

    // Calculate damage with material resistance
    const resistanceMultiplier = structure.material.resistance[damage.damageType as keyof typeof structure.material.resistance] || 1
    const actualDamage = damage.damageAmount * (1 - resistanceMultiplier)

    structure.currentHealth -= actualDamage
    structure.isDamaged = structure.currentHealth < structure.currentHealth

    // Update damage state
    const healthPercent = structure.currentHealth / structure.maxHealth
    if (healthPercent > 0.7) {
      structure.damageState = 'intact'
    } else if (healthPercent > 0.4) {
      structure.damageState = 'cracked'
    } else if (healthPercent > 0) {
      structure.damageState = 'broken'
    } else {
      structure.damageState = 'destroyed'
      this.destroyStructure(structureId)
    }

    // Create visual damage effects
    this.createDamageEffects(structure, damage)

    // Generate debris
    this.generateDebris(structure, damage)

    return true
  }

  private destroyStructure(structureId: string): void {
    const structure = this.placedStructures.get(structureId)
    if (!structure) return

    // Create destruction effects
    this.createDestructionEffects(structure)

    // Remove mesh
    const mesh = this.structureMeshes.get(structureId)
    if (mesh) {
      this.scene.remove(mesh)
      this.structureMeshes.delete(structureId)
    }

    // Remove structure
    this.placedStructures.delete(structureId)

    toast(`${structure.type.name} destroyed!`)
  }

  private createDamageEffects(structure: PlacedStructure, damage: DestructionData): void {
    // Create visual damage indicators (cracks, holes, etc.)
    const mesh = this.structureMeshes.get(structure.id)
    if (!mesh) return

    // Add damage decals or modify geometry
    // This would involve more complex geometry manipulation in a real implementation
  }

  private createDestructionEffects(structure: PlacedStructure): void {
    // Create explosion effects, sound, particles
    const position = structure.position

    // Create particle system for destruction
    const particleCount = 50
    for (let i = 0; i < particleCount; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      )

      const particle: DebrisParticle = {
        id: `debris_${Date.now()}_${i}`,
        position: position.clone(),
        velocity,
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        ),
        size: Math.random() * 0.5 + 0.1,
        material: structure.material,
        lifetime: 5000
      }

      this.debrisParticles.push(particle)
    }
  }

  private generateDebris(structure: PlacedStructure, damage: DestructionData): void {
    // Generate smaller debris particles based on damage
    const debrisCount = Math.floor(damage.damageAmount / 10)

    for (let i = 0; i < debrisCount; i++) {
      const particle: DebrisParticle = {
        id: `debris_${Date.now()}_${i}`,
        position: damage.impactPoint.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 5,
          (Math.random() - 0.5) * 5
        ),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        ),
        size: Math.random() * 0.2 + 0.05,
        material: structure.material,
        lifetime: 3000
      }

      this.debrisParticles.push(particle)
    }
  }

  // Resource Management
  public gatherResources(resourceType: keyof PlayerResources, amount: number): void {
    const currentAmount = this.playerResources[resourceType]
    const newAmount = Math.min(currentAmount + amount, this.playerResources.maxCapacity)
    this.playerResources[resourceType] = newAmount

    if (newAmount > currentAmount) {
      toast.success(`Gathered ${newAmount - currentAmount} ${resourceType}!`)
    }
  }

  public getPlayerResources(): PlayerResources {
    return { ...this.playerResources }
  }

  // Building Validation Helpers
  private hasSupportingStructure(position: THREE.Vector3, structure: StructureType): boolean {
    // Check if there's a supporting structure below
    for (const [id, placedStructure] of this.placedStructures) {
      if (placedStructure.isCompleted) {
        const bbox = this.getStructureBoundingBox(placedStructure)
        if (this.checkBoundingBoxSupport(position, structure, bbox)) {
          return true
        }
      }
    }
    return false
  }

  private checkStructureCollision(position: THREE.Vector3, structure: StructureType): boolean {
    const newBBox = this.getNewStructureBoundingBox(position, structure)

    for (const [id, placedStructure] of this.placedStructures) {
      if (placedStructure.isCompleted) {
        const existingBBox = this.getStructureBoundingBox(placedStructure)
        if (this.checkBoxIntersection(newBBox, existingBBox)) {
          return true
        }
      }
    }
    return false
  }

  private getStructureBoundingBox(structure: PlacedStructure): THREE.Box3 {
    const halfWidth = structure.type.dimensions.width / 2
    const halfHeight = structure.type.dimensions.height / 2
    const halfDepth = structure.type.dimensions.depth / 2

    const min = new THREE.Vector3(
      structure.position.x - halfWidth,
      structure.position.y - halfHeight,
      structure.position.z - halfDepth
    )

    const max = new THREE.Vector3(
      structure.position.x + halfWidth,
      structure.position.y + halfHeight,
      structure.position.z + halfDepth
    )

    return new THREE.Box3(min, max)
  }

  private getNewStructureBoundingBox(position: THREE.Vector3, structure: StructureType): THREE.Box3 {
    const halfWidth = structure.dimensions.width / 2
    const halfHeight = structure.dimensions.height / 2
    const halfDepth = structure.dimensions.depth / 2

    const min = new THREE.Vector3(
      position.x - halfWidth,
      position.y - halfHeight,
      position.z - halfDepth
    )

    const max = new THREE.Vector3(
      position.x + halfWidth,
      position.y + halfHeight,
      position.z + halfDepth
    )

    return new THREE.Box3(min, max)
  }

  private checkBoundingBoxSupport(position: THREE.Vector3, structure: StructureType, supportBox: THREE.Box3): boolean {
    const newBox = this.getNewStructureBoundingBox(position, structure)

    // Check if the new structure is supported from below
    const newBottom = newBox.min.y
    const supportTop = supportBox.max.y

    // Check horizontal overlap and vertical support
    const horizontalOverlap =
      newBox.max.x > supportBox.min.x &&
      newBox.min.x < supportBox.max.x &&
      newBox.max.z > supportBox.min.z &&
      newBox.min.z < supportBox.max.z

    const verticalSupport = Math.abs(newBottom - supportTop) < 0.5

    return horizontalOverlap && verticalSupport
  }

  private checkBoxIntersection(box1: THREE.Box3, box2: THREE.Box3): boolean {
    return (
      box1.max.x > box2.min.x &&
      box1.min.x < box2.max.x &&
      box1.max.y > box2.min.y &&
      box1.min.y < box2.max.y &&
      box1.max.z > box2.min.z &&
      box1.min.z < box2.max.z
    )
  }

  // Update Loop
  public update(deltaTime: number): void {
    // Update debris particles
    this.updateDebrisParticles(deltaTime)

    // Update destruction queue
    this.processDestructionQueue()

    // Update building animations
    this.updateBuildingAnimations(deltaTime)

    // Update preview position
    if (this.isBuildingMode && this.previewStructure) {
      this.updatePreviewPosition()
    }
  }

  private updateDebrisParticles(deltaTime: number): void {
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const particle = this.debrisParticles[i]

      // Update physics
      particle.velocity.y -= 9.81 * deltaTime // Gravity
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      // Update rotation
      particle.angularVelocity.multiplyScalar(0.99) // Damping

      // Update lifetime
      particle.lifetime -= deltaTime * 1000

      // Remove expired particles
      if (particle.lifetime <= 0) {
        this.debrisParticles.splice(i, 1)
      }
    }
  }

  private processDestructionQueue(): void {
    while (this.destructionQueue.length > 0) {
      const destruction = this.destructionQueue.shift()!
      this.applyDamage(destruction.structureId, destruction)
    }
  }

  private updateBuildingAnimations(deltaTime: number): void {
    // Update any ongoing building animations
    for (const structure of this.placedStructures.values()) {
      if (!structure.isCompleted) {
        // Building animation is handled in startBuildingAnimation
      }
    }
  }

  private updatePreviewPosition(): void {
    if (!this.previewStructure || !this.selectedStructureType) return

    // Raycast from camera to get world position
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(0.5, 0.5) // Center of screen

    raycaster.setFromCamera(mouse, this.camera)

    // Get ground position (you might want to check against terrain or other structures)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersectPoint = new THREE.Vector3()

    if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
      // Snap to grid
      const gridSize = 1
      intersectPoint.x = Math.round(intersectPoint.x / gridSize) * gridSize
      intersectPoint.y = Math.round(intersectPoint.y / gridSize) * gridSize
      intersectPoint.z = Math.round(intersectPoint.z / gridSize) * gridSize

      this.previewStructure.position.copy(intersectPoint)

      // Update preview color based on validity
      const isValid = this.validateStructurePlacement(intersectPoint, this.selectedStructureType)
      const child = this.previewStructure.children[0]
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshBasicMaterial
        material.color.setHex(isValid ? 0x00ff00 : 0xff0000)
      }
    }
  }

  private setupEventListeners(): void {
    // Add event listeners for building controls
    // This would integrate with your input system
  }

  // Public Getters
  public getBuildingMaterials(): BuildingMaterial[] {
    return Array.from(this.buildingMaterials.values())
  }

  public getStructureTypes(): StructureType[] {
    return Array.from(this.structureTypes.values())
  }

  public getPlacedStructures(): PlacedStructure[] {
    return Array.from(this.placedStructures.values())
  }

  public isInBuildingMode(): boolean {
    return this.isBuildingMode
  }

  public isInEditMode(): boolean {
    return this.isEditMode
  }

  public getSelectedStructure(): StructureType | null {
    return this.selectedStructureType
  }

  public getSelectedMaterial(): BuildingMaterial | null {
    return this.selectedMaterial
  }

  // Cleanup
  public destroy(): void {
    // Remove all structures from scene
    this.structureMeshes.forEach(mesh => {
      this.scene.remove(mesh)
    })

    // Clear all collections
    this.placedStructures.clear()
    this.structureMeshes.clear()
    this.debrisParticles.length = 0
    this.destructionQueue.length = 0

    // Remove preview
    this.removePreviewStructure()
  }
}

// Building Rules Interface
interface BuildingRule {
  type: string
  description: string
  validator: (position: THREE.Vector3, structure: StructureType) => boolean
}

// React Component for Building System UI
export function GLXYBuildingSystemUI() {
  const [buildingSystem, setBuildingSystem] = useState<GLXYBuildingSystem | null>(null)
  const [isBuildingMode, setIsBuildingMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [playerResources, setPlayerResources] = useState({ wood: 100, stone: 50, metal: 25, energy: 10 })

  useEffect(() => {
    // Initialize building system when scene is available
    // This would be integrated with your Three.js scene setup
  }, [])

  const gatherResource = (resourceType: keyof typeof playerResources) => {
    const amount = Math.floor(Math.random() * 10) + 5
    setPlayerResources(prev => ({
      ...prev,
      [resourceType]: prev[resourceType] + amount
    }))
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">GLXY Building System</h1>
        <p className="text-gray-300">Build, destroy, and fortify your position</p>
      </div>

      {/* Resource Display */}
      <Card className="mb-6 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trees className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Wood</span>
              </div>
              <span className="font-mono text-white">{playerResources.wood}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Stone</span>
              </div>
              <span className="font-mono text-white">{playerResources.stone}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">Metal</span>
              </div>
              <span className="font-mono text-white">{playerResources.metal}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-400" />
                <span className="text-gray-300">Energy</span>
              </div>
              <span className="font-mono text-white">{playerResources.energy}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => gatherResource('wood')}>
              <Trees className="h-4 w-4 mr-2" />
              Gather Wood
            </Button>
            <Button size="sm" onClick={() => gatherResource('stone')}>
              <Square className="h-4 w-4 mr-2" />
              Gather Stone
            </Button>
            <Button size="sm" onClick={() => gatherResource('metal')}>
              <Zap className="h-4 w-4 mr-2" />
              Gather Metal
            </Button>
            <Button size="sm" onClick={() => gatherResource('energy')}>
              <Droplets className="h-4 w-4 mr-2" />
              Gather Energy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Building Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structure Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5" />
              Structure Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {['all', 'wall', 'floor', 'ramp', 'stair', 'door', 'window', 'tower', 'bridge'].map(category => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {buildingSystem?.getStructureTypes()
                .filter(structure => selectedCategory === 'all' || structure.category === selectedCategory)
                .map(structure => (
                <motion.div
                  key={structure.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className={`cursor-pointer transition-all ${!structure.isUnlocked ? 'opacity-50' : ''} bg-gray-800/50`}>
                    <CardContent className="p-4">
                      <div className="text-2xl mb-2">{structure.icon}</div>
                      <h3 className="font-semibold text-white mb-1">{structure.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {structure.category}
                        </Badge>
                        {!structure.isUnlocked && (
                          <Badge variant="destructive" className="text-xs">
                            Lv. {structure.unlockLevel}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {structure.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-yellow-400">{structure.cost} credits</span>
                        <Button size="sm" disabled={!structure.isUnlocked}>
                          {structure.isUnlocked ? 'Select' : 'Locked'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Material Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buildingSystem?.getBuildingMaterials().map(material => (
                <Card key={material.id} className={`bg-gray-800/50 ${!material.isUnlocked ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{material.name}</h3>
                      <div className={`w-4 h-4 rounded`} style={{ backgroundColor: material.color }} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Durability:</span>
                        <span className="text-white">{material.durability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Strength:</span>
                        <span className="text-white">{material.strength}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mb-2">
                      Cost: {material.cost.wood} wood, {material.cost.stone} stone, {material.cost.metal} metal
                    </div>

                    {!material.isUnlocked ? (
                      <div className="text-xs text-yellow-400 mb-2">
                        Unlocks at level {material.unlockLevel}
                      </div>
                    ) : (
                      <Button size="sm" className="w-full">
                        Select Material
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Building Mode Toggle */}
      <Card className="mt-6 bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Building Mode</h3>
              <p className="text-sm text-gray-400">
                {isBuildingMode ? 'Click to place structures' : 'Enter building mode to construct'}
              </p>
            </div>
            <Button
              size="lg"
              className={isBuildingMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
              onClick={() => setIsBuildingMode(!isBuildingMode)}
            >
              {isBuildingMode ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Building Active
                </>
              ) : (
                <>
                  <Hammer className="h-5 w-5 mr-2" />
                  Enter Building Mode
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GLXYBuildingSystemUI