/**
 * Professional Character Loader
 * 
 * Lädt hochwertige Character Models mit Multi-Textur-Support
 * Optimiert für game_ready_low_poly_character_tactical
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CHARACTER_ASSETS, SmartAssetSelector, BALANCED_SELECTOR } from '../assets/AssetDatabase'

export interface CharacterConfig {
  name: string
  gltfPath?: string  // Optional: GLTF mit separaten Texturen
  glbPath?: string   // Optional: GLB (alles in einer Datei)
  scale: number
  LOD?: {
    high: string  // High-Quality für Player
    medium: string // Medium für nahe Enemies
    low: string   // Low für ferne Enemies
  }
}

/**
 * Professional Character Configurations
 */
export const PROFESSIONAL_CHARACTERS: { [key: string]: CharacterConfig } = {
  tactical_operator_high: {
    name: 'Tactical Operator (High-Res)',
    gltfPath: '/models/game_ready_low_poly_character_tactical/scene.gltf', // Mit High-Res Texturen
    scale: 0.01, // GLTF Models sind oft 100x zu groß
    LOD: {
      high: '/models/game_ready_low_poly_character_tactical/scene.gltf',
      medium: '/models/tactical_game_ready_1k.glb',
      low: '/models/tactical_game_ready_1k.glb'
    }
  },
  tactical_operator_optimized: {
    name: 'Tactical Operator (Optimized)',
    glbPath: '/models/tactical_game_ready_1k.glb', // 1K Texturen = besser Performance
    scale: 0.01
  }
}

/**
 * Lädt professionelle Character Models mit LOD-Support
 */
export class ProfessionalCharacterLoader {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader | null = null
  private cache: Map<string, THREE.Group> = new Map()

  constructor() {
    this.loader = new GLTFLoader()
    
    try {
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath('/draco/')
      this.loader.setDRACOLoader(this.dracoLoader)
    } catch (error) {
      console.warn('⚠️ DRACO Loader not available')
    }
  }

/**
   * ✅ BESTE METHODE: Smart Asset Selection aus Database
   */
  async loadCharacterSmart(
    usage: 'player' | 'enemy',
    distance?: number,
    selector: SmartAssetSelector = BALANCED_SELECTOR
  ): Promise<THREE.Group> {
    // Auto-Select BESTES Asset aus Database
    const asset = selector.selectBestCharacter(usage, distance)
    
    console.log(`🎯 Smart Asset Selected:`)
    console.log(`   Name: ${asset.name}`)
    console.log(`   Quality: ${asset.quality} (${asset.textureResolution || 'N/A'})`)
    console.log(`   Score: ${asset.score} (Visual: ${asset.visual}, Perf: ${asset.performance})`)
    
    return this.loadCharacterFromPath(asset.path, asset.id)
  }

  /**
   * Lädt einen Character mit automatischer LOD-Auswahl
   */
  async loadCharacter(
    characterId: string,
    lodLevel: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<THREE.Group> {
    const config = PROFESSIONAL_CHARACTERS[characterId]
    if (!config) {
      throw new Error(`Character not found: ${characterId}`)
    }

    // Bestimme welche Datei geladen werden soll
    let modelPath: string
    if (config.LOD && lodLevel !== 'high') {
      modelPath = lodLevel === 'medium' ? config.LOD.medium : config.LOD.low
    } else {
      modelPath = config.gltfPath || config.glbPath || ''
    }

    // Cache-Check
    const cacheKey = `${characterId}:${lodLevel}`
    if (this.cache.has(cacheKey)) {
      // Silent cache hit - no console spam
      return this.cache.get(cacheKey)!.clone()
    }

    return this.loadCharacterFromPath(modelPath, characterId, config.scale)
  }

  /**
   * ✅ Shared Loading Logic
   */
  private async loadCharacterFromPath(
    modelPath: string,
    characterId: string,
    scale: number = 0.01
  ): Promise<THREE.Group> {
    const cacheKey = `${characterId}:${modelPath}`
    
    // Cache-Check
    if (this.cache.has(cacheKey)) {
      // Silent cache hit - no console spam
      return this.cache.get(cacheKey)!.clone()
    }

    try {
      // Silent loading - no console spam
      
      const gltf = await this.loader.loadAsync(modelPath)
      const character = gltf.scene

      // Scale anwenden (GLTF Models sind oft zu groß!)
      character.scale.setScalar(scale)

      // Setup für Game-Ready Character
      this.setupCharacter(character, characterId)

      // Animations-Support (silent)
      if (gltf.animations && gltf.animations.length > 0) {
        // AnimationMixer wird vom ModelManager erstellt
      }

      // Cache character
      this.cache.set(cacheKey, character.clone())
      
      // Silent success - no console spam
      return character

    } catch (error) {
      console.error(`❌ Failed to load character: ${characterId}`, error)
      throw error
    }
  }

  /**
   * Setup Character für optimale Darstellung
   */
  private setupCharacter(character: THREE.Group, characterId: string): void {
    character.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        
        // Shadows
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Material Optimierung
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => this.optimizeMaterial(mat))
          } else {
            this.optimizeMaterial(mesh.material)
          }
        }

        // Frustum Culling
        mesh.frustumCulled = true
      }
    })

    // Bounding Box für Collision
    const bbox = new THREE.Box3().setFromObject(character)
    character.userData.boundingBox = bbox
    character.userData.isCharacter = true
    character.userData.characterId = characterId
  }

  /**
   * Optimiert Materials für bessere Performance
   */
  private optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // PBR-optimierte Settings
      material.side = THREE.FrontSide // Nur Vorderseite rendern
      material.needsUpdate = true
      
      // Anisotropic Filtering für bessere Textur-Qualität
      if (material.map) {
        material.map.anisotropy = 16
      }
      if (material.normalMap) {
        material.normalMap.anisotropy = 16
      }
    }
  }

  /**
   * Lädt Player Character (immer High-Res)
   */
  async loadPlayerCharacter(characterId: string = 'tactical_operator_high'): Promise<THREE.Group> {
    return this.loadCharacter(characterId, 'high')
  }

  /**
   * Lädt Enemy Character (LOD basiert auf Distanz)
   */
  async loadEnemyCharacter(
    characterId: string = 'tactical_operator_optimized',
    distance: number = 20
  ): Promise<THREE.Group> {
    // Auto-LOD basiert auf Distanz
    let lod: 'high' | 'medium' | 'low' = 'medium'
    if (distance > 50) lod = 'low'
    else if (distance < 20) lod = 'high'
    
    return this.loadCharacter(characterId, lod)
  }

  /**
   * Liste aller verfügbaren Characters
   */
  getAvailableCharacters(): CharacterConfig[] {
    return Object.values(PROFESSIONAL_CHARACTERS)
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.cache.clear()
    if (this.dracoLoader) {
      this.dracoLoader.dispose()
    }
  }
}

